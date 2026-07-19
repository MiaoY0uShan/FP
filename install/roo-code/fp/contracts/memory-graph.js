#!/usr/bin/env node
'use strict';

// FP Memory Graph v1 — Zero-dependency graph operations library.
//
// Usage (CLI):
//   node memory-graph.js build [--graph-id <id>] [--cards-dir <path>] [--lessons-dir <path>]
//   node memory-graph.js blast-radius <nodeId> [--depth <n>]
//   node memory-graph.js communities [--algorithm <connected_components|label_propagation>]
//   node memory-graph.js hubs
//   node memory-graph.js incremental [--old-graph <path>]
//   node memory-graph.js cluster <keywords...>
//   node memory-graph.js validate [--strict]
//   node memory-graph.js sync-backlinks
//   node memory-graph.js dot
//   node memory-graph.js stats
//
// Usage (API):
//   const mg = require('./memory-graph.js');
//   const graph = mg.buildGraph({ cardsDir, lessonsDir });
//   const result = mg.blastRadius(graph, 'L001-remote-stateful-service-chain', 1);
//   const communities = mg.findCommunities(graph, 'connected_components');
//   const { hubs, bridges } = mg.detectHubsAndBridges(graph);
//   const cluster = mg.findRelevantCluster(graph, ['validation', 'bug']);
//   const errors = mg.validateGraph(graph, { strict: true });
//
// No dependencies beyond Node.js built-in modules (fs, path, crypto).
// Compatible with Node.js 18+.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ── Helpers ──────────────────────────────────────────────────────────

function sha256(content) {
  return 'sha256:' + crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

const YAML_FRONTMATTER_RE = /^---\s*\n([\s\S]*?)\n---/;
const WIKILINK_RE = /\[\[([^\]]+)\]\]/g;
const WIKILINK_WITH_TYPE_RE = /\[\[([^\]]+)\]\](?:\((\w+)\))?/g;

function parseYamlFrontmatter(content) {
  const match = content.match(YAML_FRONTMATTER_RE);
  if (!match) return { frontmatter: {}, bodyStart: 0 };
  const lines = match[1].split('\n');
  const fm = {};
  const listKeys = {};
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) {
      // Could be a list item continuation (indented)
      continue;
    }
    const key = line.slice(0, colonIdx).trim();
    let value = line.slice(colonIdx + 1).trim();
    // Handle quoted strings
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    // Handle empty arrays: key: []
    if (value === '[]') {
      fm[key] = [];
      listKeys[key] = true;
    } else if (value === '{}') {
      fm[key] = {};
    } else if (value === 'true' || value === 'false') {
      fm[key] = value === 'true';
    } else if (value === '' || value === '~' || value === 'null') {
      fm[key] = null;
    } else {
      fm[key] = value;
    }
  }
  return { frontmatter: fm, bodyStart: match[0].length };
}

function extractWikilinks(content) {
  const links = [];
  WIKILINK_WITH_TYPE_RE.lastIndex = 0;
  let match;
  while ((match = WIKILINK_WITH_TYPE_RE.exec(content)) !== null) {
    links.push({ target: match[1].trim(), edgeType: match[2] || 'related_to' });
  }
  return links;
}

function extractHeading(content, heading) {
  const re = new RegExp(`##\\s+${heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\n([\\s\\S]*?)(?=\\n##\\s|$)`, 'i');
  const match = content.match(re);
  if (!match) return '';
  return match[1].trim();
}

function parseCardListSection(content, heading) {
  const text = extractHeading(content, heading);
  if (!text) return [];
  const items = [];
  for (const line of text.split('\n')) {
    const trimmed = line.replace(/^[-*]\s+/, '').trim();
    if (trimmed && !trimmed.startsWith('#')) {
      // Extract filename from markdown links or plain text
      const linkMatch = trimmed.match(/\[([^\]]+)\]/);
      items.push(linkMatch ? linkMatch[1] : trimmed);
    }
  }
  return items;
}

function normalizeNodeId(filename) {
  return filename.replace(/\.md$/, '');
}

// ── Build Graph ──────────────────────────────────────────────────────

/**
 * Scan source card directories and build the memory graph.
 *
 * @param {Object} opts
 * @param {string} [opts.repoRoot] — repository root (defaults to two levels up from this file)
 * @param {string} [opts.cardsDir] — relative path to schema cards (default: fp/schema-memory)
 * @param {string} [opts.lessonsDir] — relative path to lessons-learned (default: fp/lessons-learned)
 * @param {string} [opts.examplesDir] — relative path to example schema cards (default: fp/examples)
 * @param {string} [opts.graphId] — stable graph identifier
 * @returns {{graph: object, warnings: string[]}}
 */
function buildGraph(opts = {}) {
  const repoRoot = opts.repoRoot || path.resolve(__dirname, '..', '..');
  const cardsDir = opts.cardsDir || path.join('fp', 'schema-memory');
  const lessonsDir = opts.lessonsDir || path.join('fp', 'lessons-learned');
  const examplesDir = opts.examplesDir || path.join('fp', 'examples');
  const graphId = opts.graphId || 'fp-memory-graph';

  const absCards = path.resolve(repoRoot, cardsDir);
  const absLessons = path.resolve(repoRoot, lessonsDir);
  const absExamples = path.resolve(repoRoot, examplesDir);

  const nodes = [];
  const edges = [];
  const warnings = [];
  const nodeIds = new Set();

  // Schema node_type detection: the canonical schema cards are SKILL.md files
  // in subdirectories of fp/. Actual card instances are .md files in
  // schema-memory/ (not yet populated) and examples/.
  // For now, schema_card nodes come from:
  //   1. Any .md file in fp/examples/ that has a ## Schema Name heading
  //   2. Any .md file referenced as a schema card by other cards
  // Lessons are .md files in fp/lessons-learned/ (excluding README.md).

  function scanSchemaCards(dir, prefix) {
    if (!fs.existsSync(dir)) return [];
    const results = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
      if (entry.name === 'README.md' || entry.name === 'SKILL.md') continue;
      const filePath = path.join(prefix, entry.name);
      const absPath = path.join(dir, entry.name);
      const content = fs.readFileSync(absPath, 'utf8');
      const { frontmatter } = parseYamlFrontmatter(content);
      const schemaName = extractHeading(content, 'Schema Name') || frontmatter.schema_name || '';
      // Only treat as schema_card if it has Schema Name heading or is explicitly a schema card
      if (!schemaName && !filePath.includes('schema-memory-card')) {
        // Check if it looks like a lesson card instead
        if (extractHeading(content, 'Anti-Pattern') || extractHeading(content, 'Lesson:')) {
          continue; // It's a lesson, skip
        }
      }
      const nodeId = normalizeNodeId(entry.name);
      const taskTypes = frontmatter.task_types
        ? (Array.isArray(frontmatter.task_types) ? frontmatter.task_types : [frontmatter.task_types])
        : [];
      // Parse related-schemas from frontmatter
      const relatedSchemas = frontmatter['related-schemas'] || {};

      results.push({
        absPath, filePath, content, nodeId,
        nodeType: 'schema_card',
        schemaName,
        taskTypes,
        relatedSchemas,
        status: frontmatter.status || 'proposed'
      });
    }
    return results;
  }

  function scanLessonCards(dir, prefix) {
    if (!fs.existsSync(dir)) return [];
    const results = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
      if (entry.name === 'README.md') continue;
      const filePath = path.join(prefix, entry.name);
      const absPath = path.join(dir, entry.name);
      const content = fs.readFileSync(absPath, 'utf8');
      // Determine status from the Status section
      const statusText = extractHeading(content, 'Status');
      let status = 'legacy';
      if (statusText) {
        const lower = statusText.toLowerCase();
        if (lower.includes('promoted')) status = 'promoted';
        else if (lower.includes('active')) status = 'active';
        else if (lower.includes('shadow')) status = 'shadow';
        else if (lower.includes('observation')) status = 'observation';
        else if (lower.includes('legacy')) status = 'legacy';
      }
      results.push({
        absPath, filePath, content,
        nodeId: normalizeNodeId(entry.name),
        nodeType: 'lesson_card',
        status
      });
    }
    return results;
  }

  const schemaCards = scanSchemaCards(absExamples, examplesDir);
  // Also scan for standalone schema cards (e.g. in a future fp/schema-memory/ dir)
  if (fs.existsSync(absCards)) {
    schemaCards.push(...scanSchemaCards(absCards, cardsDir));
  }
  const lessonCards = scanLessonCards(absLessons, lessonsDir);

  // Phase 1: Create all nodes
  for (const card of schemaCards) {
    if (nodeIds.has(card.nodeId)) {
      warnings.push(`Duplicate node_id: ${card.nodeId} — skipping second occurrence`);
      continue;
    }
    nodeIds.add(card.nodeId);
    nodes.push({
      node_id: card.nodeId,
      node_type: card.nodeType,
      file_path: card.filePath,
      content_hash: sha256(card.content),
      status: card.status,
      schema_name: card.schemaName || undefined,
      task_types: card.taskTypes || [],
      in_degree: 0,
      out_degree: 0,
      is_hub: false,
      is_bridge: false,
      community_id: undefined,
      last_validated: undefined
    });
  }

  for (const card of lessonCards) {
    if (nodeIds.has(card.nodeId)) {
      warnings.push(`Duplicate node_id: ${card.nodeId} — skipping second occurrence`);
      continue;
    }
    nodeIds.add(card.nodeId);
    nodes.push({
      node_id: card.nodeId,
      node_type: card.nodeType,
      file_path: card.filePath,
      content_hash: sha256(card.content),
      status: card.status,
      schema_name: undefined,
      task_types: [],
      in_degree: 0,
      out_degree: 0,
      is_hub: false,
      is_bridge: false,
      community_id: undefined,
      last_validated: undefined
    });
  }

  // Phase 2: Create edges from YAML frontmatter (schema cards) and wikilinks (lesson cards)
  const nodeMap = new Map(nodes.map(n => [n.node_id, n]));

  for (const card of schemaCards) {
    const source = nodeMap.get(card.nodeId);
    if (!source) continue;

    // Process related-schemas from YAML frontmatter
    const rs = card.relatedSchemas || {};
    const edgeTypes = ['depends_on', 'informs', 'conflicts_with', 'supersedes', 'generalizes'];
    for (const etype of edgeTypes) {
      let targets = rs[etype];
      if (!targets) continue;
      if (!Array.isArray(targets)) targets = [targets];
      for (const targetName of targets) {
        const targetId = normalizeNodeId(String(targetName));
        const target = nodeMap.get(targetId);
        if (!target) {
          warnings.push(`Edge target not found: ${card.nodeId} --[${etype}]--> ${targetId} (file not found)`);
          continue;
        }
        edges.push({
          source_id: card.nodeId,
          target_id: targetId,
          edge_type: etype,
          direction: 'outgoing',
          created_at: new Date().toISOString()
        });
        source.out_degree++;
        target.in_degree++;
      }
    }

    // Also scan body wikilinks in schema cards (for cross-type references)
    const bodyLinks = extractWikilinks(card.content);
    for (const link of bodyLinks) {
      const targetId = normalizeNodeId(link.target);
      const target = nodeMap.get(targetId);
      if (!target || targetId === card.nodeId) continue;
      // Avoid duplicate edges
      const alreadyExists = edges.some(e =>
        e.source_id === card.nodeId && e.target_id === targetId && e.edge_type === link.edgeType);
      if (!alreadyExists) {
        edges.push({
          source_id: card.nodeId,
          target_id: targetId,
          edge_type: link.edgeType,
          direction: 'outgoing',
          created_at: new Date().toISOString()
        });
        source.out_degree++;
        target.in_degree++;
      }
    }
  }

  for (const card of lessonCards) {
    const source = nodeMap.get(card.nodeId);
    if (!source) continue;

    const bodyLinks = extractWikilinks(card.content);
    for (const link of bodyLinks) {
      const targetId = normalizeNodeId(link.target);
      const target = nodeMap.get(targetId);
      if (!target) {
        warnings.push(`Wikilink target not found: ${card.nodeId} -> [[${targetId}]]`);
        continue;
      }
      if (targetId === card.nodeId) continue;
      const alreadyExists = edges.some(e =>
        e.source_id === card.nodeId && e.target_id === targetId && e.edge_type === link.edgeType);
      if (!alreadyExists) {
        edges.push({
          source_id: card.nodeId,
          target_id: targetId,
          edge_type: link.edgeType,
          direction: 'outgoing',
          created_at: new Date().toISOString()
        });
        source.out_degree++;
        target.in_degree++;
      }
    }
  }

  // Phase 3: Compute in_degree / out_degree and is_hub on all nodes
  for (const node of nodes) {
    node.is_hub = node.in_degree >= 3;
  }

  const graph = {
    schema_version: '1.0.0',
    graph_id: graphId,
    updated_at: new Date().toISOString(),
    nodes,
    edges
  };

  return { graph, warnings };
}

// ── Blast Radius ─────────────────────────────────────────────────────

/**
 * Compute the blast radius of a node — all nodes reachable within `depth` hops
 * in either direction (outgoing + incoming edges).
 *
 * @param {object} graph — a memory graph object
 * @param {string} seedNodeId
 * @param {number} [depth=1]
 * @returns {object|null} blastRadiusResult or null if seed not found
 */
function blastRadius(graph, seedNodeId, depth = 1) {
  const nodeMap = new Map(graph.nodes.map(n => [n.node_id, n]));
  if (!nodeMap.has(seedNodeId)) return null;

  // Build adjacency (undirected for blast radius — we care about all connections)
  const adj = new Map();
  for (const n of graph.nodes) {
    adj.set(n.node_id, new Set());
  }
  for (const e of graph.edges) {
    adj.get(e.source_id)?.add(e.target_id);
    adj.get(e.target_id)?.add(e.source_id);
  }

  // BFS
  const visited = new Set();
  const queue = [{ id: seedNodeId, dist: 0 }];
  visited.add(seedNodeId);

  const forwardFanout = new Set();
  const reverseFanout = new Set();

  // Direct edges from/to seed for forward/reverse classification
  for (const e of graph.edges) {
    if (e.source_id === seedNodeId) forwardFanout.add(e.target_id);
    if (e.target_id === seedNodeId) reverseFanout.add(e.source_id);
  }

  while (queue.length > 0) {
    const { id, dist } = queue.shift();
    if (dist >= depth) continue;
    for (const neighbor of adj.get(id) || []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push({ id: neighbor, dist: dist + 1 });
        // Classify based on distance from seed via edge direction
        for (const e of graph.edges) {
          if (e.source_id === id && e.target_id === neighbor) {
            if (id === seedNodeId || forwardFanout.has(id)) forwardFanout.add(neighbor);
          }
          if (e.target_id === id && e.source_id === neighbor) {
            if (id === seedNodeId || reverseFanout.has(id)) reverseFanout.add(neighbor);
          }
        }
      }
    }
  }

  // Union
  const affected = new Set([...forwardFanout, ...reverseFanout]);
  if (affected.size === 0 && forwardFanout.size === 0 && reverseFanout.size === 0) {
    // Still include the seed itself
    affected.add(seedNodeId);
  }

  return {
    seed_node_id: seedNodeId,
    affected_nodes: [...affected].filter(id => id !== seedNodeId),
    forward_fanout: [...forwardFanout].filter(id => id !== seedNodeId),
    reverse_fanout: [...reverseFanout].filter(id => id !== seedNodeId),
    depth,
    computed_at: new Date().toISOString()
  };
}

// ── Find Communities ─────────────────────────────────────────────────

/**
 * Find communities in the graph using connected components (undirected)
 * or label propagation (directed, lightweight approximation).
 *
 * @param {object} graph
 * @param {'connected_components'|'label_propagation'} [algorithm='connected_components']
 * @returns {object} clusterResult
 */
function findCommunities(graph, algorithm = 'connected_components') {
  const nodeIds = graph.nodes.map(n => n.node_id);
  const adj = new Map();
  for (const id of nodeIds) {
    adj.set(id, []);
  }
  for (const e of graph.edges) {
    adj.get(e.source_id)?.push(e.target_id);
    if (algorithm === 'connected_components') {
      adj.get(e.target_id)?.push(e.source_id);
    }
  }

  const communities = [];
  const visited = new Set();

  function bfs(startId, communityId) {
    const component = [];
    const queue = [startId];
    visited.add(startId);
    while (queue.length > 0) {
      const id = queue.shift();
      component.push(id);
      for (const neighbor of adj.get(id) || []) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }
    return component;
  }

  let commIdx = 0;
  for (const id of nodeIds) {
    if (!visited.has(id)) {
      const component = bfs(id, `community-${commIdx}`);
      if (component.length > 0) {
        // Find the best label: the node with the highest degree in this component
        let bestNode = component[0];
        let bestDeg = 0;
        for (const cid of component) {
          const deg = (adj.get(cid) || []).length;
          if (deg > bestDeg) { bestDeg = deg; bestNode = cid; }
        }
        const node = graph.nodes.find(n => n.node_id === bestNode);
        const label = node ? (node.schema_name || node.node_id) : component[0];
        communities.push({
          community_id: `community-${commIdx}`,
          node_ids: component,
          label
        });
        commIdx++;
      }
    }
  }

  // Assign community_id back to nodes
  for (const node of graph.nodes) {
    const comm = communities.find(c => c.node_ids.includes(node.node_id));
    node.community_id = comm ? comm.community_id : undefined;
  }

  return {
    communities,
    algorithm,
    computed_at: new Date().toISOString()
  };
}

// ── Hub and Bridge Detection ─────────────────────────────────────────

/**
 * Detect hub nodes (high in_degree) and bridge nodes (removal disconnects graph).
 *
 * @param {object} graph
 * @returns {object} hubReport
 */
function detectHubsAndBridges(graph) {
  const nodeMap = new Map(graph.nodes.map(n => [n.node_id, n]));

  // Hubs: sort by in_degree descending
  const hubs = graph.nodes
    .filter(n => n.in_degree >= 3)
    .sort((a, b) => b.in_degree - a.in_degree)
    .map(n => ({
      node_id: n.node_id,
      in_degree: n.in_degree,
      out_degree: n.out_degree,
      level: n.in_degree >= 5 ? 'critical_hub' : 'hub'
    }));

  // Bridges: for each node, check if removing it increases component count
  const bridges = [];
  const nodeIds = new Set(graph.nodes.map(n => n.node_id));

  // Build undirected adjacency
  const adj = new Map();
  for (const id of nodeIds) adj.set(id, []);
  for (const e of graph.edges) {
    adj.get(e.source_id)?.push(e.target_id);
    adj.get(e.target_id)?.push(e.source_id);
  }

  // Count components with all nodes
  function countComponents(excludeId = null) {
    const visited = new Set();
    if (excludeId) visited.add(excludeId);
    let count = 0;
    for (const id of nodeIds) {
      if (visited.has(id)) continue;
      count++;
      const queue = [id];
      visited.add(id);
      while (queue.length > 0) {
        const current = queue.shift();
        for (const neighbor of adj.get(current) || []) {
          if (!visited.has(neighbor)) {
            visited.add(neighbor);
            queue.push(neighbor);
          }
        }
      }
    }
    return count;
  }

  const baseComponents = countComponents();

  for (const node of graph.nodes) {
    const without = countComponents(node.node_id);
    if (without > baseComponents) {
      // Find which communities it connects
      const allComms = new Set();
      // BFS from one neighbor to see which communities are reachable
      const neighbors = adj.get(node.node_id) || [];
      for (const nbr of neighbors) {
        const nbrNode = nodeMap.get(nbr);
        if (nbrNode && nbrNode.community_id) allComms.add(nbrNode.community_id);
      }
      node.is_bridge = true;
      bridges.push({
        node_id: node.node_id,
        connects_communities: [...allComms]
      });
    } else {
      node.is_bridge = false;
    }
  }

  return {
    hubs,
    bridges,
    computed_at: new Date().toISOString()
  };
}

// ── Incremental Update ───────────────────────────────────────────────

/**
 * Compare current source files against a prior graph snapshot and compute
 * the incremental diff: which nodes changed, which are affected.
 *
 * @param {object} currentGraph — freshly built graph
 * @param {object} oldGraph — previous graph snapshot
 * @returns {object} incrementalDiff
 */
function incrementalUpdate(currentGraph, oldGraph) {
  const oldNodeMap = new Map((oldGraph.nodes || []).map(n => [n.node_id, n]));
  const curNodeMap = new Map(currentGraph.nodes.map(n => [n.node_id, n]));

  const changedNodes = [];
  const hashDiffs = [];

  for (const [id, curNode] of curNodeMap) {
    const oldNode = oldNodeMap.get(id);
    if (!oldNode) {
      changedNodes.push(id);
      hashDiffs.push({ node_id: id, old_hash: null, new_hash: curNode.content_hash });
    } else if (oldNode.content_hash !== curNode.content_hash) {
      changedNodes.push(id);
      hashDiffs.push({ node_id: id, old_hash: oldNode.content_hash, new_hash: curNode.content_hash });
    }
  }

  // Check for removed nodes
  for (const [id] of oldNodeMap) {
    if (!curNodeMap.has(id)) {
      changedNodes.push(id);
      hashDiffs.push({ node_id: id, old_hash: oldNodeMap.get(id).content_hash, new_hash: null });
    }
  }

  // Compute affected nodes: blast radius of each changed node
  const affectedSet = new Set();
  for (const id of changedNodes) {
    const result = blastRadius(currentGraph, id, 1);
    if (result) {
      for (const aid of result.affected_nodes) affectedSet.add(aid);
    }
  }

  // needs_review: subset of affected nodes where the change may invalidate them
  const needsReview = [...affectedSet].filter(id => {
    const node = curNodeMap.get(id);
    if (!node) return false;
    // Hub nodes and nodes with depends_on edges to changed nodes need review
    if (node.is_hub) return true;
    for (const e of currentGraph.edges) {
      if (e.source_id === id && e.edge_type === 'depends_on' && changedNodes.includes(e.target_id)) {
        return true;
      }
    }
    return false;
  });

  return {
    changed_nodes: changedNodes,
    hash_diffs: hashDiffs,
    affected_nodes: [...affectedSet],
    needs_review: needsReview,
    computed_at: new Date().toISOString()
  };
}

// ── Find Relevant Cluster ────────────────────────────────────────────

/**
 * Find the connected component of schemas relevant to a set of keywords.
 *
 * @param {object} graph
 * @param {string[]} keywords
 * @param {object} [opts]
 * @param {number} [opts.maxCards=5] — max cards to return
 * @returns {object[]} matched cards with relevance scores
 */
function findRelevantCluster(graph, keywords, opts = {}) {
  const maxCards = opts.maxCards || 5;
  const lowerKeywords = keywords.map(k => k.toLowerCase());

  // Score each node by keyword match against task_types and schema_name
  const scored = graph.nodes
    .filter(n => n.node_type === 'schema_card' || n.node_type === 'lesson_card')
    .map(n => {
      let score = 0;
      const taskTypes = (n.task_types || []).map(t => t.toLowerCase());
      const schemaName = (n.schema_name || '').toLowerCase();
      const nodeId = n.node_id.toLowerCase();

      for (const kw of lowerKeywords) {
        if (taskTypes.some(t => t.includes(kw) || kw.includes(t))) score += 2;
        if (schemaName.includes(kw)) score += 1;
        if (nodeId.includes(kw)) score += 0.5;
      }
      return { node: n, score };
    })
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) return [];

  // One-hop expansion: for each keyword-matched card, add its direct neighbors
  const included = new Set();
  const result = [];

  for (const { node, score } of scored) {
    if (included.has(node.node_id)) continue;
    included.add(node.node_id);
    result.push({ node, score, reason: 'keyword_match' });
    if (result.length >= maxCards) break;
  }

  // If we have room, add high-relevance neighbors
  if (result.length < maxCards) {
    for (const { node } of scored.slice(0, result.length)) {
      for (const e of graph.edges) {
        if (result.length >= maxCards) break;
        const neighborId = e.source_id === node.node_id ? e.target_id : (e.target_id === node.node_id ? e.source_id : null);
        if (!neighborId || included.has(neighborId)) continue;
        const neighbor = graph.nodes.find(n => n.node_id === neighborId);
        if (!neighbor) continue;
        // Only include if it's a schema or lesson card
        if (neighbor.node_type !== 'schema_card' && neighbor.node_type !== 'lesson_card') continue;
        included.add(neighborId);
        result.push({ node: neighbor, score: 0.5, reason: `one_hop_from:${node.node_id}` });
      }
    }
  }

  return result.slice(0, maxCards);
}

// ── Validate Graph ───────────────────────────────────────────────────

/**
 * Validate the graph for structural and referential integrity.
 *
 * @param {object} graph
 * @param {object} [opts]
 * @param {boolean} [opts.strict=false] — when true, also check for missing edge evidence
 * @returns {{ errors: object[], warnings: object[] }}
 */
function validateGraph(graph, opts = {}) {
  const errors = [];
  const warnings = [];
  const nodeMap = new Map(graph.nodes.map(n => [n.node_id, n]));

  function err(at, message) {
    return { path: at, message };
  }
  function warn(at, message) {
    return { path: at, message };
  }

  // Check schema version
  if (graph.schema_version !== '1.0.0') {
    errors.push(err('$.schema_version', 'must be "1.0.0"'));
  }

  // Check required arrays
  if (!Array.isArray(graph.nodes)) {
    errors.push(err('$.nodes', 'must be an array'));
    return { errors, warnings };
  }
  if (!Array.isArray(graph.edges)) {
    errors.push(err('$.edges', 'must be an array'));
    return { errors, warnings };
  }

  // Check duplicate node_ids
  const seenIds = new Set();
  for (const node of graph.nodes) {
    if (seenIds.has(node.node_id)) {
      errors.push(err(`$.nodes[${node.node_id}]`, 'duplicate node_id'));
    }
    seenIds.add(node.node_id);

    // Check content_hash format
    if (node.content_hash && !/^sha256:[a-f0-9]{64}$/.test(node.content_hash)) {
      errors.push(err(`$.nodes[${node.node_id}].content_hash`, 'must match pattern sha256:<64-char-hex>'));
    }

    // Check node_type
    if (!['schema_card', 'lesson_card', 'evidence_ledger', 'template'].includes(node.node_type)) {
      errors.push(err(`$.nodes[${node.node_id}].node_type`, `invalid type: ${node.node_type}`));
    }

    // Check status
    if (!['observation', 'shadow', 'proposed', 'promoted', 'active', 'rejected', 'archived', 'legacy'].includes(node.status)) {
      errors.push(err(`$.nodes[${node.node_id}].status`, `invalid status: ${node.status}`));
    }
  }

  // Check edge referential integrity
  const edgeKeys = new Set();
  for (const edge of graph.edges) {
    const key = `${edge.source_id}->${edge.target_id}:${edge.edge_type}`;
    if (edgeKeys.has(key)) {
      warnings.push(warn(`$.edges[${key}]`, 'duplicate edge'));
    }
    edgeKeys.add(key);

    if (!nodeMap.has(edge.source_id)) {
      errors.push(err(`$.edges[${key}]`, `source node not found: ${edge.source_id}`));
    }
    if (!nodeMap.has(edge.target_id)) {
      errors.push(err(`$.edges[${key}]`, `target node not found: ${edge.target_id}`));
    }

    const validTypes = [
      'depends_on', 'informs', 'conflicts_with', 'supersedes',
      'generalizes', 'caused_by', 'mitigated_by', 'related_to', 'references'
    ];
    if (!validTypes.includes(edge.edge_type)) {
      errors.push(err(`$.edges[${key}]`, `invalid edge_type: ${edge.edge_type}`));
    }

    if (edge.direction !== 'outgoing') {
      errors.push(err(`$.edges[${key}]`, 'direction must be "outgoing"'));
    }

    if (opts.strict && !edge.evidence_ref) {
      warnings.push(warn(`$.edges[${key}]`, 'missing evidence_ref'));
    }
  }

  // Check for isolated nodes (no edges at all)
  const connected = new Set();
  for (const e of graph.edges) {
    connected.add(e.source_id);
    connected.add(e.target_id);
  }
  for (const node of graph.nodes) {
    if (!connected.has(node.node_id)) {
      warnings.push(warn(`$.nodes[${node.node_id}]`, 'isolated node: no edges connect to it'));
    }
  }

  // Check in_degree / out_degree consistency
  for (const node of graph.nodes) {
    const actualIn = graph.edges.filter(e => e.target_id === node.node_id).length;
    const actualOut = graph.edges.filter(e => e.source_id === node.node_id).length;
    if (node.in_degree !== actualIn) {
      warnings.push(warn(`$.nodes[${node.node_id}].in_degree`, `stored=${node.in_degree} actual=${actualIn}`));
    }
    if (node.out_degree !== actualOut) {
      warnings.push(warn(`$.nodes[${node.node_id}].out_degree`, `stored=${node.out_degree} actual=${actualOut}`));
    }
    if (node.is_hub && node.in_degree < 3) {
      warnings.push(warn(`$.nodes[${node.node_id}].is_hub`, 'marked as hub but in_degree < 3'));
    }
  }

  return { errors, warnings };
}

// ── Sync Backlinks ───────────────────────────────────────────────────

/**
 * Sync computed fields (backlinks, community_id, is_hub, hub_level) back to
 * source markdown cards and the JSON snapshot. This closes the loop: the graph
 * is built FROM cards, enriched WITH graph analysis, then written BACK to cards.
 *
 * @param {object} graph — a built graph (from buildGraph or loadGraph)
 * @param {object} [opts]
 * @param {boolean} [opts.dryRun=false] — if true, report what would change without writing
 * @param {string} [opts.repoRoot] — repository root
 * @returns {{updated: string[], errors: string[]}}
 */
function syncBacklinks(graph, opts = {}) {
  const repoRoot = opts.repoRoot || path.resolve(__dirname, '..', '..');
  const dryRun = opts.dryRun || false;
  const updated = [];
  const errors = [];

  // Build backlinks map: for each node, which nodes point TO it
  const backlinks = new Map();
  for (const node of graph.nodes) {
    backlinks.set(node.node_id, new Map()); // edge_type -> [source_ids]
  }
  for (const edge of graph.edges) {
    const bl = backlinks.get(edge.target_id);
    if (!bl) continue;
    if (!bl.has(edge.edge_type)) bl.set(edge.edge_type, []);
    bl.get(edge.edge_type).push(edge.source_id);
  }

  // Run hub/bridge/community detection once so we have all computed fields
  findCommunities(graph, 'connected_components');
  const { hubs, bridges } = detectHubsAndBridges(graph);

  // Build hub/bridge lookup
  const hubLevel = new Map();
  for (const h of hubs) hubLevel.set(h.node_id, h.level);
  const bridgeSet = new Set(bridges.map(b => b.node_id));

  for (const node of graph.nodes) {
    const filePath = path.resolve(repoRoot, node.file_path);
    if (!fs.existsSync(filePath)) continue;

    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // ── Update backlinks section ──
    const bl = backlinks.get(node.node_id);
    const backlinksHeader = '## Backlinks (computed — do not author)';
    const backlinksRegex = new RegExp(
      `\n${escapeRegex(backlinksHeader)}[\\s\\S]*?(?=\n## [A-Z]|\n---|\n$|$)`,
      'm'
    );

    const blLines = [];
    if (bl && bl.size > 0) {
      for (const [edgeType, sources] of bl) {
        for (const src of sources.sort()) {
          blLines.push(`- [[${src}]](${edgeType})`);
        }
      }
    }
    if (blLines.length === 0) {
      blLines.push('_No inbound references._');
    }
    // Add computed fields summary
    const communityId = node.community_id || '';
    const hubStatus = hubLevel.has(node.node_id) ? `hub (${hubLevel.get(node.node_id)})` : (node.is_hub ? 'hub' : 'leaf');
    const bridgeStatus = bridgeSet.has(node.node_id) ? 'bridge' : '';

    const metaParts = [];
    if (communityId) metaParts.push(communityId);
    metaParts.push(hubStatus);
    if (bridgeStatus) metaParts.push(bridgeStatus);

    const backlinksContent = [
      '',
      backlinksHeader,
      '',
      `> ${metaParts.join(' | ')} | in_degree=${node.in_degree} out_degree=${node.out_degree} | rebuilt ${new Date().toISOString().slice(0, 10)}`,
      '',
      ...blLines,
      ''
    ].join('\n');

    if (backlinksRegex.test(content)) {
      const newContent = content.replace(backlinksRegex, backlinksContent);
      if (newContent !== content) { content = newContent; changed = true; }
    } else {
      // Append before the last major section or at end
      content = content.trimEnd() + '\n' + backlinksContent;
      changed = true;
    }

    if (changed) {
      if (!dryRun) {
        fs.writeFileSync(filePath, content, 'utf8');
      }
      updated.push(node.file_path);
    }
  }

  // Also update the JSON snapshot
  if (!dryRun && updated.length > 0) {
    graph.updated_at = new Date().toISOString();
    saveGraph(graph);
  }

  return { updated, errors };
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ── Label Propagation ────────────────────────────────────────────────

/**
 * Label Propagation community detection. A lightweight alternative to
 * Leiden/Louvain that works on directed graphs.
 *
 * Algorithm:
 * 1. Initialize each node as its own community.
 * 2. Iterate: each node adopts the most common label among its neighbors.
 * 3. Stop when labels stabilize or max iterations reached.
 *
 * @param {object} graph
 * @param {number} [maxIterations=20]
 * @returns {object} clusterResult
 */
function labelPropagation(graph, maxIterations = 20) {
  const nodeIds = graph.nodes.map(n => n.node_id);
  const idxMap = new Map(nodeIds.map((id, i) => [id, i]));
  const n = nodeIds.length;

  // Build directed adjacency
  const neighbors = Array.from({ length: n }, () => []);
  for (const e of graph.edges) {
    const si = idxMap.get(e.source_id);
    const ti = idxMap.get(e.target_id);
    if (si !== undefined && ti !== undefined) {
      neighbors[si].push(ti);
      neighbors[ti].push(si); // treat as undirected for community detection
    }
  }

  // Initialize labels: each node is its own community
  let labels = Array.from({ length: n }, (_, i) => i);
  let changed = true;
  let iter = 0;

  while (changed && iter < maxIterations) {
    changed = false;
    iter++;

    // Visit nodes in random order for better convergence
    const order = Array.from({ length: n }, (_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }

    for (const idx of order) {
      const neighborLabels = {};
      let maxCount = 0;
      let bestLabel = labels[idx];

      for (const nbr of neighbors[idx]) {
        const lbl = labels[nbr];
        neighborLabels[lbl] = (neighborLabels[lbl] || 0) + 1;
        if (neighborLabels[lbl] > maxCount ||
            (neighborLabels[lbl] === maxCount && lbl < bestLabel)) {
          maxCount = neighborLabels[lbl];
          bestLabel = lbl;
        }
      }

      if (bestLabel !== labels[idx] && maxCount > 0) {
        labels[idx] = bestLabel;
        changed = true;
      }
    }
  }

  // Consolidate labels to sequential IDs
  const labelMap = new Map();
  let nextId = 0;
  const consolidated = labels.map(l => {
    if (!labelMap.has(l)) labelMap.set(l, nextId++);
    return labelMap.get(l);
  });

  // Group nodes by community
  const commMap = new Map();
  for (let i = 0; i < n; i++) {
    const cid = `community-${consolidated[i]}`;
    if (!commMap.has(cid)) commMap.set(cid, []);
    commMap.get(cid).push(nodeIds[i]);
  }

  // Compute modularity (simple approximation)
  const m = graph.edges.length;
  let modularity = 0;
  if (m > 0) {
    const degrees = new Map();
    for (const e of graph.edges) {
      degrees.set(e.source_id, (degrees.get(e.source_id) || 0) + 1);
      degrees.set(e.target_id, (degrees.get(e.target_id) || 0) + 1);
    }
    for (const [cid, members] of commMap) {
      const memberSet = new Set(members);
      let internalEdges = 0;
      let totalDegree = 0;
      for (const id of members) {
        totalDegree += degrees.get(id) || 0;
        for (const e of graph.edges) {
          if (e.source_id === id && memberSet.has(e.target_id)) internalEdges++;
        }
      }
      const expected = (totalDegree * totalDegree) / (4 * m * m);
      modularity += (internalEdges / (2 * m || 1)) - expected;
    }
  }

  // Assign community_id back to nodes
  for (const node of graph.nodes) {
    for (const [cid, members] of commMap) {
      if (members.includes(node.node_id)) {
        node.community_id = cid;
        break;
      }
    }
  }

  const communities = [];
  for (const [cid, members] of commMap) {
    if (members.length === 0) continue;
    // Label by most-connected node in community
    let bestNode = members[0];
    let bestDeg = 0;
    for (const id of members) {
      const deg = (neighbors[idxMap.get(id)] || []).length;
      if (deg > bestDeg) { bestDeg = deg; bestNode = id; }
    }
    const node = graph.nodes.find(n => n.node_id === bestNode);
    communities.push({
      community_id: cid,
      node_ids: members.sort(),
      label: node ? (node.schema_name || node.node_id) : members[0]
    });
  }

  return {
    communities: communities.sort((a, b) => a.community_id.localeCompare(b.community_id)),
    algorithm: 'label_propagation',
    modularity,
    iterations: iter,
    computed_at: new Date().toISOString()
  };
}

// ── Betweenness Centrality ───────────────────────────────────────────

/**
 * Compute betweenness centrality for all nodes. Betweenness measures
 * how often a node lies on the shortest path between other nodes.
 * Nodes with high betweenness are critical bridges in the network.
 *
 * Uses Brandes' algorithm: O(V * E) for unweighted graphs.
 * For FP's small graph size (tens of nodes), this is instantaneous.
 *
 * @param {object} graph
 * @returns {Map<string, number>} node_id -> betweenness score (normalized)
 */
function betweennessCentrality(graph) {
  const nodeIds = graph.nodes.map(n => n.node_id);
  const idxMap = new Map(nodeIds.map((id, i) => [id, i]));
  const n = nodeIds.length;

  // Build undirected adjacency
  const adj = Array.from({ length: n }, () => []);
  for (const e of graph.edges) {
    const si = idxMap.get(e.source_id);
    const ti = idxMap.get(e.target_id);
    if (si !== undefined && ti !== undefined && si !== ti) {
      if (!adj[si].includes(ti)) adj[si].push(ti);
      if (!adj[ti].includes(si)) adj[ti].push(si);
    }
  }

  const C = new Array(n).fill(0);

  for (let s = 0; s < n; s++) {
    const S = [];
    const P = Array.from({ length: n }, () => []);
    const sigma = new Array(n).fill(0);
    sigma[s] = 1;
    const d = new Array(n).fill(-1);
    d[s] = 0;
    const Q = [s];

    while (Q.length > 0) {
      const v = Q.shift();
      S.push(v);
      for (const w of adj[v]) {
        // w found for the first time?
        if (d[w] < 0) {
          Q.push(w);
          d[w] = d[v] + 1;
        }
        // shortest path to w via v?
        if (d[w] === d[v] + 1) {
          sigma[w] += sigma[v];
          P[w].push(v);
        }
      }
    }

    const delta = new Array(n).fill(0);
    // S is in order of non-decreasing distance from s
    while (S.length > 0) {
      const w = S.pop();
      for (const v of P[w]) {
        delta[v] += (sigma[v] / sigma[w]) * (1 + delta[w]);
      }
      if (w !== s) {
        C[w] += delta[w];
      }
    }
  }

  // Normalize: for undirected, divide by 2 then by (n-1)(n-2)/2
  const normFactor = n > 2 ? ((n - 1) * (n - 2)) / 2 : 1;
  const scores = new Map();
  for (let i = 0; i < n; i++) {
    scores.set(nodeIds[i], C[i] / (2 * normFactor || 1));
  }

  return scores;
}

// ── Graph to DOT ─────────────────────────────────────────────────────

/**
 * Export the graph in Graphviz DOT format.
 *
 * @param {object} graph
 * @returns {string} DOT source
 */
function graphToDot(graph) {
  const lines = [];
  lines.push('digraph FP_Memory_Graph {');
  lines.push('  rankdir=LR;');
  lines.push('  node [shape=box, style=rounded];');
  lines.push('');

  // Node styles by type
  const typeStyles = {
    schema_card: 'fillcolor=lightblue, style="filled,rounded"',
    lesson_card: 'fillcolor=lightyellow, style="filled,rounded"',
    evidence_ledger: 'fillcolor=lightgreen, style="filled,rounded"',
    template: 'fillcolor=lightgray, style="filled,rounded"'
  };

  const edgeStyles = {
    depends_on: 'color=red, style=solid',
    informs: 'color=blue, style=dashed',
    conflicts_with: 'color=orange, style=dotted',
    supersedes: 'color=purple, style=solid',
    generalizes: 'color=green, style=solid',
    caused_by: 'color=red, style=dashed',
    mitigated_by: 'color=blue, style=solid',
    related_to: 'color=gray, style=dotted',
    references: 'color=gray, style=dashed'
  };

  for (const node of graph.nodes) {
    const style = typeStyles[node.node_type] || '';
    const label = (node.schema_name || node.node_id).replace(/"/g, '\\"');
    const hub = node.is_hub ? ', penwidth=2' : '';
    const bridge = node.is_bridge ? ', peripheries=2' : '';
    lines.push(`  "${node.node_id}" [label="${label}"${style ? ', ' + style : ''}${hub}${bridge}];`);
  }

  lines.push('');

  for (const edge of graph.edges) {
    const style = edgeStyles[edge.edge_type] || '';
    lines.push(`  "${edge.source_id}" -> "${edge.target_id}" [label="${edge.edge_type}"${style ? ', ' + style : ''}];`);
  }

  lines.push('}');
  return lines.join('\n') + '\n';
}

// ── Stats ────────────────────────────────────────────────────────────

function stats(graph) {
  const nodeTypes = {};
  const statuses = {};
  const edgeTypes = {};
  for (const n of graph.nodes) {
    nodeTypes[n.node_type] = (nodeTypes[n.node_type] || 0) + 1;
    statuses[n.status] = (statuses[n.status] || 0) + 1;
  }
  for (const e of graph.edges) {
    edgeTypes[e.edge_type] = (edgeTypes[e.edge_type] || 0) + 1;
  }
  const hubs = graph.nodes.filter(n => n.is_hub).length;
  const bridges = graph.nodes.filter(n => n.is_bridge).length;
  const isolated = graph.nodes.filter(n => {
    return !graph.edges.some(e => e.source_id === n.node_id || e.target_id === n.node_id);
  }).length;
  return {
    total_nodes: graph.nodes.length,
    total_edges: graph.edges.length,
    node_types: nodeTypes,
    statuses,
    edge_types: edgeTypes,
    hubs,
    critical_hubs: graph.nodes.filter(n => n.in_degree >= 5).length,
    bridges,
    isolated_nodes: isolated,
    graph_id: graph.graph_id,
    updated_at: graph.updated_at
  };
}

// ── Persistence ──────────────────────────────────────────────────────

const DEFAULT_GRAPH_PATH = path.join(__dirname, 'memory-graph.snapshot.json');

function loadGraph(filePath = DEFAULT_GRAPH_PATH) {
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

function saveGraph(graph, filePath = DEFAULT_GRAPH_PATH) {
  fs.writeFileSync(filePath, JSON.stringify(graph, null, 2) + '\n', 'utf8');
}

// ── CLI ──────────────────────────────────────────────────────────────

function printJson(obj) {
  process.stdout.write(JSON.stringify(obj, null, 2) + '\n');
}

function resolveOpts(argv) {
  const opts = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--graph-id' && i + 1 < argv.length) opts.graphId = argv[++i];
    if (argv[i] === '--cards-dir' && i + 1 < argv.length) opts.cardsDir = argv[++i];
    if (argv[i] === '--lessons-dir' && i + 1 < argv.length) opts.lessonsDir = argv[++i];
    if (argv[i] === '--depth' && i + 1 < argv.length) opts.depth = parseInt(argv[++i], 10);
    if (argv[i] === '--algorithm' && i + 1 < argv.length) opts.algorithm = argv[++i];
    if (argv[i] === '--old-graph' && i + 1 < argv.length) opts.oldGraphPath = argv[++i];
    if (argv[i] === '--strict') opts.strict = true;
    if (argv[i] === '--max-cards' && i + 1 < argv.length) opts.maxCards = parseInt(argv[++i], 10);
  }
  return opts;
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const commandArgs = args.slice(1);
  const opts = resolveOpts(commandArgs);

  if (!command || command === 'help' || command === '--help') {
    console.log(`FP Memory Graph v1

Usage: node memory-graph.js <command> [options]

Commands:
  build       Build graph from source cards and save snapshot
  blast-radius <nodeId>  Compute blast radius for a node
  communities Find communities (clusters) in the graph
  hubs        Detect hub, bridge nodes, and betweenness centrality
  incremental Compare current sources against a prior snapshot
  cluster <keywords...>  Find relevant schema/lesson cluster for keywords
  validate    Validate graph integrity
  sync        Sync computed backlinks to source cards
  betweenness  Compute betweenness centrality scores
  dot         Export graph in Graphviz DOT format
  stats       Print graph statistics

Options:
  --graph-id <id>        Graph identifier (default: fp-memory-graph)
  --cards-dir <path>     Schema cards directory (default: fp/schema-memory)
  --lessons-dir <path>   Lessons directory (default: fp/lessons-learned)
  --depth <n>            BFS depth for blast-radius (default: 1)
  --algorithm <name>     Community detection algorithm (default: connected_components)
  --old-graph <path>     Prior snapshot path for incremental update
  --strict               Enable strict validation
  --max-cards <n>        Max cards for cluster retrieval (default: 5)
`);
    process.exit(0);
  }

  try {
    switch (command) {
      case 'build': {
        const { graph, warnings } = buildGraph(opts);
        saveGraph(graph);
        printJson({ status: 'ok', graph_id: graph.graph_id, nodes: graph.nodes.length, edges: graph.edges.length, warnings });
        break;
      }
      case 'blast-radius': {
        if (commandArgs.length === 0 || commandArgs[0].startsWith('--')) {
          console.error('Usage: node memory-graph.js blast-radius <nodeId> [--depth <n>]');
          process.exit(1);
        }
        const graph = loadGraph();
        if (!graph) { console.error('No graph snapshot found. Run "build" first.'); process.exit(1); }
        const result = blastRadius(graph, commandArgs[0], opts.depth || 1);
        if (!result) { console.error(`Node "${commandArgs[0]}" not found.`); process.exit(1); }
        printJson(result);
        break;
      }
      case 'communities': {
        const graph = loadGraph();
        if (!graph) { console.error('No graph snapshot found. Run "build" first.'); process.exit(1); }
        const algo = opts.algorithm || 'connected_components';
        const result = algo === 'label_propagation'
          ? labelPropagation(graph)
          : findCommunities(graph, algo);
        printJson(result);
        break;
      }
      case 'hubs': {
        const graph = loadGraph();
        if (!graph) { console.error('No graph snapshot found. Run "build" first.'); process.exit(1); }
        const result = detectHubsAndBridges(graph);
        printJson(result);
        break;
      }
      case 'incremental': {
        const { graph } = buildGraph(opts);
        const oldGraph = loadGraph(opts.oldGraphPath || DEFAULT_GRAPH_PATH);
        if (!oldGraph) {
          printJson({ status: 'no_baseline', message: 'No prior snapshot. Run "build" to create one.', changed_nodes: graph.nodes.map(n => n.node_id) });
        } else {
          const result = incrementalUpdate(graph, oldGraph);
          printJson(result);
        }
        break;
      }
      case 'cluster': {
        if (commandArgs.length === 0 || commandArgs[0].startsWith('--')) {
          console.error('Usage: node memory-graph.js cluster <keyword1> [keyword2...]');
          process.exit(1);
        }
        const graph = loadGraph();
        if (!graph) { console.error('No graph snapshot found. Run "build" first.'); process.exit(1); }
        const keywords = commandArgs.filter(a => !a.startsWith('--'));
        const result = findRelevantCluster(graph, keywords, { maxCards: opts.maxCards || 5 });
        printJson(result.map(r => ({
          node_id: r.node.node_id,
          schema_name: r.node.schema_name || undefined,
          node_type: r.node.node_type,
          score: r.score,
          reason: r.reason
        })));
        break;
      }
      case 'validate': {
        const graph = loadGraph();
        if (!graph) { console.error('No graph snapshot found. Run "build" first.'); process.exit(1); }
        const result = validateGraph(graph, { strict: opts.strict || false });
        if (result.errors.length === 0 && result.warnings.length === 0) {
          printJson({ status: 'ok', message: 'Graph is valid.' });
        } else {
          printJson({ status: result.errors.length > 0 ? 'invalid' : 'warning', errors: result.errors, warnings: result.warnings });
          if (result.errors.length > 0) process.exit(1);
        }
        break;
      }
      case 'dot': {
        const graph = loadGraph();
        if (!graph) { console.error('No graph snapshot found. Run "build" first.'); process.exit(1); }
        process.stdout.write(graphToDot(graph));
        break;
      }
      case 'betweenness': {
        const graph = loadGraph();
        if (!graph) { console.error('No graph snapshot found. Run "build" first.'); process.exit(1); }
        const scores = betweennessCentrality(graph);
        const sorted = [...scores.entries()].sort((a, b) => b[1] - a[1]);
        printJson(Object.fromEntries(sorted));
        break;
      }
      case 'sync': {
        const graph = loadGraph();
        if (!graph) { console.error('No graph snapshot found. Run "build" first.'); process.exit(1); }
        const dryRun = commandArgs.includes('--dry-run');
        const result = syncBacklinks(graph, { dryRun, repoRoot: opts.repoRoot || path.resolve(__dirname, '..', '..') });
        printJson({ status: 'ok', dry_run: dryRun, updated: result.updated.length, files: result.updated, errors: result.errors });
        break;
      }
      case 'stats': {
        const graph = loadGraph();
        if (!graph) { console.error('No graph snapshot found. Run "build" first.'); process.exit(1); }
        printJson(stats(graph));
        break;
      }
      default:
        console.error(`Unknown command: ${command}`);
        console.error('Run "node memory-graph.js help" for usage.');
        process.exit(1);
    }
  } catch (e) {
    console.error(`Error: ${e.message}`);
    if (process.env.DEBUG) console.error(e.stack);
    process.exit(1);
  }
}

// ── Exports ──────────────────────────────────────────────────────────

module.exports = {
  buildGraph,
  blastRadius,
  findCommunities,
  labelPropagation,
  betweennessCentrality,
  detectHubsAndBridges,
  incrementalUpdate,
  findRelevantCluster,
  validateGraph,
  syncBacklinks,
  graphToDot,
  stats,
  loadGraph,
  saveGraph,
  parseYamlFrontmatter,
  extractWikilinks,
  sha256,
};

// Run CLI if invoked directly
if (require.main === module) {
  main();
}
