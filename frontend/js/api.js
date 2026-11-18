'use strict';
/* =========================================================
   KẾT NỐI BACKEND
   - API_BASE: để trống nếu backend phục vụ luôn frontend (cùng tên miền)
   - Nếu không có mạng / chưa đăng nhập: lưu game vào máy (localStorage)
========================================================= */
const API=(()=>{
  const base=(window.API_BASE||'').replace(/\/$/,'')+'/api';
  const store={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{v==null?localStorage.removeItem(k):localStorage.setItem(k,v)}catch(e){}}};
  let token=store.get('tb_token'),user=JSON.parse(store.get('tb_user')||'null');
  async function req(method,path,body){
    const r=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:body?JSON.stringify(body):undefined});
    let j={};try{j=await r.json()}catch(e){}
    if(r.status===401&&token){setSession(null)}
    if(!r.ok)throw new Error(j.error||('Lỗi '+r.status));
    return j;
  }
  function setSession(s){token=s?s.token:null;user=s?s.user:null;store.set('tb_token',token);store.set('tb_user',user?JSON.stringify(user):null)}
  const LOCAL='tb_save_local';
  return{
    get user(){return user},
    get loggedIn(){return !!token},
    async health(){try{await req('GET','/health');return true}catch(e){return false}},
    async register(u,p){setSession(await req('POST','/auth/register',{username:u,password:p}));return user},
    async login(u,p){setSession(await req('POST','/auth/login',{username:u,password:p}));return user},
    logout(){setSession(null);store.set(LOCAL,null)}, // xóa cả bản lưu tạm trên máy để không lẫn sang tài khoản/khách khác
    async loadSave(){if(token){try{return (await req('GET','/save')).data}catch(e){}}const s=store.get(LOCAL);return s?JSON.parse(s):null},
    async save(data){store.set(LOCAL,JSON.stringify(data));if(token){try{await req('PUT','/save',{data})}catch(e){console.warn('Lưu lên máy chủ thất bại',e.message)}}},
    async clearSave(){store.set(LOCAL,null);if(token){try{await req('DELETE','/save')}catch(e){}}},
    async submitRun(r){if(!token)return null;try{return await req('POST','/runs',r)}catch(e){console.warn(e.message);return null}},
    leaderboard(hero){return req('GET','/leaderboard'+(hero?'?hero='+hero:''))},
    stats(){return req('GET','/stats/me')},
  };
})();
