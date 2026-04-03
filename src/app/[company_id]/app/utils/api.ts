 export const API_BASE_URL = "http://localhost/index.php";
export const SESSION_TOKEN_KEY = "sessionToken";
export const SESSION_USER_KEY = "sessionUser";

 export interface ApiResponse<T = any> {
  status: "success" | "error";
  message?: string;
  data?: T;
  token?: string;
  user?: any;
  [key:string]:any;
}


export const getToken = () => localStorage.getItem(SESSION_TOKEN_KEY);

export const setSession = (token: string, user: any) => {
  localStorage.setItem(SESSION_TOKEN_KEY, token);
  localStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
};

export const logout = () => {
  localStorage.removeItem(SESSION_TOKEN_KEY);
  localStorage.removeItem(SESSION_USER_KEY);
};

export const getSession = () => {
  const token = getToken();
  const user = localStorage.getItem(SESSION_USER_KEY);
  if (!token) return null;
  return { token, user: user ? JSON.parse(user) : null };
};

// ✅ POST helper
export async function postRequest<T = any>(
  payload: Omit<Record<string, any>, "company_id">
): Promise<ApiResponse<T>> {
  const token = getToken();

  const fullPayload = { ...payload };

  // Only add company_id for non-login
  const session = getSession();
  if (payload.token !== "checkUser" && session?.user?.company_id) {
    fullPayload.company_id = session.user.company_id;
  }

  const res = await fetch(API_BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token || ""}`,
    },
    body: JSON.stringify(fullPayload),
  });

  const data: ApiResponse<T> = await res.json();

  if (data.token) setSession(data.token, data.user || {});

  if (!res.ok) throw new Error(data.message || "API request failed");
  return data;
}



// Types for project files
export interface ProjectFileRow {
  id: number;
  project_id: number;
  user_id: number;
  title: string;
  description: string;
  file_name: string;
  file_type: string;
  file_url: string;   // 👈 what the UI uses
  date: string;
  created_at: string;
}

export type ApiImageRow = ProjectFileRow;

// Helper: File -> base64 (data URL)
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string); // data:...;base64,...
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Shape coming back from PHP uploadProjectFile
type UploadResponse = {
  id: number;
  project_id: number;
  user_id: number;
  title: string;
  description: string;
  url: string;        // 👈 from PHP
  file_type: string;
  file_name: string;
  date: string;
};

export async function apiUploadImage(file: File): Promise<ApiImageRow> {
  const base64 = await fileToBase64(file);

  // dummy values
  const dummyProjectId = 1;
  const dummyTitle = "Dummy title";
  const dummyDescription = "Dummy description";
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const res = await postRequest<UploadResponse>({
    token: "uploadProjectFile",
    data: {
      project_id: dummyProjectId,
      date: today,
      title: dummyTitle,
      description: dummyDescription,
      file_base64: base64,
      mime_type: file.type,
      original_name: file.name,
    },
  });

  if (res.status !== "success" || !res.data) {
    throw new Error(res.message || "Upload failed");
  }

  const d = res.data;

  // Map backend fields -> ProjectFileRow
  const row: ApiImageRow = {
    id: d.id,
    project_id: d.project_id,
    user_id: d.user_id,
    title: d.title,
    description: d.description,
    file_name: d.file_name,
    file_type: d.file_type,
    file_url: d.url,                        // 👈 map url → file_url
    date: d.date,
    created_at: new Date().toISOString(),   // or use value from backend if you add it
  };

  return row;
}

export async function apiGetImages(): Promise<ApiImageRow[]> {
  const dummyProjectId = 1;

  const res = await postRequest<ApiImageRow[]>({
    token: "getProjectFiles",
    data: {
      project_id: dummyProjectId,
    },
  });

  if (res.status !== "success" || !res.data) {
    throw new Error(res.message || "Failed to load files");
  }

  return res.data;
}
