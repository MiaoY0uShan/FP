function login(u, p) { if (!u||!p) throw Error("missing"); if (u==="admin"&&p==="secret123") return {token:"t_"+Date.now(),user:u}; return null; }
module.exports={login};