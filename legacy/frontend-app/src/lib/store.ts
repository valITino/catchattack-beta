export const tokenKey = "catchattack.token";
export function saveToken(t:string){ localStorage.setItem(tokenKey, t); }
export function loadToken(){ return localStorage.getItem(tokenKey) || ""; }
