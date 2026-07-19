<p align="center">
  <img src="docs/assets/fp-banner.svg" alt="FP convierte tareas ambiguas, agentes paralelos y ejemplos limitados en progreso verificable" width="100%">
</p>

# FP

**El parche no es la línea de meta. La prueba sí.**

[![Validate](https://github.com/MiaoY0uShan/FP/actions/workflows/validate.yml/badge.svg)](https://github.com/MiaoY0uShan/FP/actions/workflows/validate.yml)
[![Release](https://img.shields.io/github/v/release/MiaoY0uShan/FP)](https://github.com/MiaoY0uShan/FP/releases)
[![License: MIT](https://img.shields.io/badge/license-MIT-22c55e.svg)](LICENSE)

La mayoría de los agentes de codificación van directamente del prompt al parche. FP hace que el tuyo encuentre la tarea real, limite cada delegación y termine con evidencia que un agente padre pueda verificar de forma independiente.

También puede aprender de ejecuciones anteriores. Pero no convirtiendo un afortunado caso aislado en ley permanente.

FP infiere la activación desde el objetivo: se carga automáticamente para trabajo de ingeniería y permanece inactivo para conversación casual u otros objetivos no relacionados con ingeniería.

Sin demonio. Sin base de datos. Sin servidor MCP obligatorio. Instálalo, recarga tu agente y trabaja con normalidad.

## Conoces esta situación

Cuatro agentes tocan los mismos archivos. Uno reinicia el servicio. Otro reporta una compilación exitosa. Nadie vuelve a probar el teléfono que aún no puede conectarse.

FP le da al trabajo un límite, un responsable y una línea de meta observable.

```text
Sin FP

editar configuración -> reiniciar servicio -> estado verde -> "listo"

Con FP

reproducir el cliente real
-> comparar estado deseado / generado / efectivo
-> encontrar el primer límite que falla
-> hacer el cambio autorizado más pequeño
-> volver a ejecutar cliente real + control negativo + ciclo de vida
-> registrar evidencia
```

El segundo camino es más lento que adivinar durante unos cinco minutos. Es considerablemente más rápido que depurar la adivinanza durante dos días.

## Cómo funciona

```text
solicitud
-> enrutar por riesgo real
-> congelar alcance, autoridad y aceptación
-> ejecutar o delegar trabajo limitado
-> ejecutar verificaciones observables
-> validar el Libro de Evidencia
-> opcionalmente evaluar un candidato de aprendizaje reutilizable
```

El trabajo pequeño se mantiene pequeño. Los incidentes restauran el servicio antes de pulir. Las causas desconocidas activan diagnóstico antes de parches. Las auditorías multidispositivo recopilan evidencia de referencia antes de mutar.

Antes de añadir código, FP recorre una breve escalera de reutilización:

```text
1. ¿Necesita existir?               no -> saltar (YAGNI)
2. ¿Ya está en el código base?      sí -> reutilizar
3. ¿La biblioteca estándar lo hace? sí -> usar
4. ¿Funcionalidad nativa?           sí -> usar
5. ¿Dependencia instalada?          sí -> usar
6. ¿Una línea es suficiente?        sí -> escribir una línea
7. Solo entonces                    -> añadir el mínimo código nuevo
```

Seguridad, reversión, accesibilidad, integridad de datos y evidencia requerida no son "complejidad" a eliminar.

## Distribuido, no caótico

```text
padre / integrador
|-- investigación limitada A       solo lectura
|-- investigación limitada B       solo lectura
|-- aprendiz candidato             solo lectura, solo propuesta
|-- evaluador ciego                conjunto de prueba oculto + oráculo
|-- revisor de especificación      tarea y sesión independientes
+-- revisor de integración         tarea y sesión independientes
             -> evidencia acotada + veredictos

un escritor -> el padre reejecuta verificaciones críticas -> libro canónico
```

Cada tarea hija recibe un sobre de tarea con IDs, objetivo, contexto, rol, herramientas, límites de autoridad, dependencias, archivos/recursos, límites de iteración/tiempo/profundidad, clave de idempotencia, presupuesto de salida y condición de parada.

Las hojas no pueden delegar, usar credenciales, desplegar, enviar mensajes externos, promover memoria o mutar estado vivo.

El paralelismo es para trabajo independiente. Dos agentes editando el mismo árbol de archivos no son un sistema distribuido; son un conflicto de fusión con optimismo.

## Aprender sin memorizar el accidente

FP evoluciona políticas externas: habilidades, esquemas, listas de verificación y automatización limitada. No entrena pesos de modelo ni garantiza generalización estadística.

```text
una ejecución con evidencia -> observación
un caso grave -> lista de verificación sombra limitada y con caducidad
2-4 casos positivos independientes -> validación cruzada -> evaluación ciega
todos los pliegues + controles + invariantes + sombra futura + reversión pasan -> candidato activo aprobado
```

Paráfrasis, variantes de ruido y cinco subagentes de una sesión son controles de robustez útiles. Siguen contando como una sola experiencia independiente.

Ver la [Puerta de Generalización](fp/generalization-gate/SKILL.md) y su [contrato máquina](fp/contracts/evidence-ledger.v1.schema.json).

## Evidencia que puede decir "no"

El esquema JSON `fp/contracts/evidence-ledger.v1.schema.json` más el validador semántico sin dependencias forman la fuente de verdad. Vinculan afirmaciones a comandos observables, aplican alcances separados y fallan cerrado en verificaciones irrelevantes, métricas fabricadas o estado de continuación obsoleto.

```text
alcance -> filas de aceptación -> ejecución limitada -> verificaciones observables -> afirmaciones verificadas
```

Un proceso verde, reinicio de servicio, resumen hijo o diff de implementación no es evidencia de finalización por sí mismo. Una vez que la evidencia declarada pasa, FP emite un veredicto y se detiene.

## Instalación

Un archivo. Un instalador. Una verificación de solo lectura.

1. Descarga el último `fp-universal-v{version}.zip` de [Releases](https://github.com/MiaoY0uShan/FP/releases).
2. Extráelo en la raíz del proyecto.
3. En Windows ejecuta `INSTALL-FP.cmd`. En macOS/Linux ejecuta `sh ./INSTALL-FP.sh`.
4. Verifica con `INSTALL-FP.cmd -Verify` en Windows o `sh ./INSTALL-FP.sh --verify` en macOS/Linux, luego recarga la herramienta AI.

[Comandos exactos](INSTALL.md) | [Migración desde ZeroToHero o Xskill](MIGRATION.md) | [Respaldo copiar-pegar](fp-copy-paste.md)

Los objetivos de ingeniería activan FP sin palabra clave. Estas formas explícitas siguen siendo opcionales:

```text
FP: Diagnosticar y corregir la regresión de restablecimiento de contraseña.
$fp Revisar el flujo de trabajo de release sin editar.
```

## Números, cuando son reales

**Sin línea base no hay afirmación de mejora.**

FP puede calcular tasa de verificación, desviación de alcance, retrabajo, proxy de carga de contexto y Tokens hasta Progreso Verificado. Los valores faltantes permanecen como `unknown`.

[Contrato de métricas](docs/metrics.md) | [Casos de estudio](docs/case-studies.md)

## Rutas

FP usa un modelo comprimido de 4 rutas:

| Ruta | Cuándo | Qué sucede |
| --- | --- | --- |
| **Urgente / Alto Riesgo** | Incidentes, interrogatorios, cambios de protocolo | Confirmar intención → actuar dentro de la autoridad |
| **Diagnóstico Solo Lectura** | Fallos desconocidos o escaneos proactivos | Depurar primero: hipótesis → sonda → corrección autorizada |
| **Construir** | Implementación clara o vaga | Pequeño → Mini-informe. Medio → Informe + Libro. Vago → Tarjetas de idea |
| **Cerrar** | Cada tarea | Pasar con evidencia coincidente → un veredicto → parar |

Los perfiles de sistemas vivos, contexto externo, compatibilidad de proveedores, multi-agente, ejecución delegada, continuación, auto-iteración y aprendizaje de fondo se superponen a estas rutas.

## Influencias

FP es una implementación original. Su diseño fue afinado estudiando [Superpowers](https://github.com/obra/superpowers), [Hermes Agent](https://github.com/NousResearch/hermes-agent), [Ponytail](https://github.com/DietrichGebert/ponytail), [Context7](https://github.com/upstash/context7), [Grill Me](https://github.com/mattpocock/skills/tree/main/skills/productivity/grill-me) y [code-review-graph](https://github.com/tirth8205/code-review-graph).

---

**Idiomas:** [English](README.md) · [中文](README.zh-CN.md) · [हिन्दी](README.hi.md) · [Español](README.es.md) · [Français](README.fr.md) · [العربية](README.ar.md) · [Português](README.pt.md) · [Русский](README.ru.md) · [日本語](README.ja.md)

## Licencia

MIT. Úsalo, inspeccionalo, mejoralo y conserva el aviso.
