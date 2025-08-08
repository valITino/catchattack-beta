// Minimal API stubs used for tests
export const API_BASE = "";
export async function login(username:string,password:string){
  return {access_token:"", role:""};
}
export function withAuth(token:string){
  return {
    coverage: () => Promise.resolve([]),
    priorities: () => Promise.resolve([])
  };
}
