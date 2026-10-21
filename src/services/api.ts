const API_BASE_URL = "http://localhost:5000/api";

// ======================================================
// AUTHENTICATION
// ======================================================

interface LoginData {
  mobileNumber: string;
  password: string;
}

interface LoginUser {
  id: number;
  mobileNumber: string;
  role: string;
}

interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  user: LoginUser;
}

export const loginUser = async (data: LoginData): Promise<LoginResponse> => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Login failed");
  }

  return result;
};

export const requestPasswordReset = async (email: string): Promise<{ success: boolean; message: string }> => {
  const response = await fetch(`${API_BASE_URL}/auth/request-reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || "Failed to request password reset");
  return result;
};

export const verifyOTP = async (email: string, otp: string): Promise<{ success: boolean; message: string }> => {
  const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || "Failed to verify OTP");
  return result;
};

export const resetPassword = async (email: string, otp: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
  const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp, newPassword }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || "Failed to reset password");
  return result;
};

// ======================================================
// USER TYPES & INTERFACES
// ======================================================

export interface CreateUserData {
  firstName: string;
  lastName: string;
  username: string;
  designation: string;
  userType: string;
  email: string;
  password: string;
  mobileNumber: string;
  address?: string;
  country?: string;
  state?: string;
  city?: string;
  pincode?: string;
}

export interface UpdateUserData {
  firstName: string;
  lastName: string;
  username: string;
  designation: string;
  userType: string;
  email: string;
  mobileNumber: string;
  address?: string;
  country?: string;
  state?: string;
  city?: string;
  pincode?: string;
}

export interface UserItem {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  designation: string;
  user_type: string;
  email: string;
  mobile_number: string;
  role: string;
  address: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  pincode: string | null;
  created_by: string | null;
  created_at: string;
  updated_by: string | null;
  updated_at: string | null;
  is_active: boolean;
}

export interface GetUsersResponse {
  success: boolean;
  data: {
    totalRecords: number;
    totalPages: number;
    currentPage: number;
    limit: number;
    users: UserItem[];
  };
}

export interface CreateUserResponse {
  success: boolean;
  message: string;
  user: UserItem;
}

// ======================================================
// USER API CALLS
// ======================================================

export const createUser = async (data: CreateUserData): Promise<CreateUserResponse> => {
  const token = localStorage.getItem("token") || "";
  const response = await fetch(`${API_BASE_URL}/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Failed to create user");
  }

  return result;
};

export const getUsers = async (params: {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
  filters?: Record<string, any>;
}): Promise<GetUsersResponse> => {
  const query = new URLSearchParams();
  if (params.page) query.append("page", params.page.toString());
  if (params.limit) query.append("limit", params.limit.toString());
  if (params.search) query.append("search", params.search);
  if (params.sortBy) query.append("sortBy", params.sortBy);
  if (params.sortOrder) query.append("sortOrder", params.sortOrder);
  if (params.filters) query.append("filters", JSON.stringify(params.filters));

  const token = localStorage.getItem("token") || "";
  const response = await fetch(`${API_BASE_URL}/users?${query.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    }
  });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Failed to fetch users");
  }

  return result;
};

export const getUserById = async (id: string | number): Promise<{ success: boolean; user: UserItem }> => {
  const token = localStorage.getItem("token") || "";
  const response = await fetch(`${API_BASE_URL}/users/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    }
  });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Failed to fetch user");
  }

  return result;
};

export const updateUser = async (id: string | number, data: UpdateUserData): Promise<{ success: boolean; message: string; user: UserItem }> => {
  const token = localStorage.getItem("token") || "";
  const response = await fetch(`${API_BASE_URL}/users/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Failed to update user");
  }

  return result;
};

export const deleteUser = async (id: string | number): Promise<{ success: boolean; message: string }> => {
  const token = localStorage.getItem("token") || "";
  const response = await fetch(`${API_BASE_URL}/users/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    }
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Failed to delete user");
  }

  return result;
};

export const fetchNextItemCode = async (): Promise<string> => {
  try {
    const token = localStorage.getItem("token");
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const response = await fetch(`${API_BASE_URL}/masters/items/next-code`, { headers });
    const result = await response.json();
    if (result.success && result.data && result.data.nextCode) {
      return result.data.nextCode;
    }
  } catch {
    // fallback
  }
  return "RNNK-0001";
};

export const updateUserStatus = async (id: string | number, isActive: boolean): Promise<{ success: boolean; message: string; user: UserItem }> => {
  const token = localStorage.getItem("token") || "";
  const response = await fetch(`${API_BASE_URL}/users/${id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ isActive }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Failed to update user status");
  }

  return result;
};

// ======================================================
// PERMISSION API CALLS
// ======================================================

export const getUserPermissions = async (userId: string | number): Promise<{ success: boolean; permissions: Record<string, Record<string, Record<string, boolean>>> }> => {
  const token = localStorage.getItem("token") || "";
  const response = await fetch(`${API_BASE_URL}/users/${userId}/permissions`, {
    headers: {
      Authorization: `Bearer ${token}`,
    }
  });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Failed to fetch user permissions");
  }

  return result;
};

export const saveUserPermissions = async (userId: string | number, permissions: Record<string, Record<string, Record<string, boolean>>>): Promise<{ success: boolean; message: string }> => {
  const token = localStorage.getItem("token") || "";
  const response = await fetch(`${API_BASE_URL}/users/${userId}/permissions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ permissions }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Failed to save permissions");
  }

  return result;
};

// ======================================================
// MASTERS GENERIC API CALL WRAPPER
// ======================================================

export interface MasterListResponse<T> {
  success: boolean;
  data: {
    totalRecords: number;
    totalPages: number;
    currentPage: number;
    limit: number;
    items: T[];
  };
}

export const fetchMasterList = async <T>(endpoint: string, params: { page?: number; limit?: number; search?: string; sortBy?: string; sortOrder?: string }): Promise<MasterListResponse<T>> => {
  const query = new URLSearchParams();
  if (params.page) query.append("page", params.page.toString());
  if (params.limit) query.append("limit", params.limit.toString());
  if (params.search) query.append("search", params.search);
  if (params.sortBy) query.append("sortBy", params.sortBy);
  if (params.sortOrder) query.append("sortOrder", params.sortOrder);

  const response = await fetch(`${API_BASE_URL}/masters/${endpoint}?${query.toString()}`);
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || `Failed to fetch ${endpoint}`);
  return result;
};

export const fetchMasterById = async <T>(endpoint: string, id: string | number): Promise<{ success: boolean; data: T }> => {
  const response = await fetch(`${API_BASE_URL}/masters/${endpoint}/${id}`);
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || `Failed to fetch ${endpoint} item`);
  return result;
};

export const createMasterItem = async <T>(endpoint: string, data: any): Promise<{ success: boolean; message: string; data: T }> => {
  const response = await fetch(`${API_BASE_URL}/masters/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || `Failed to create ${endpoint}`);
  return result;
};

export const updateMasterItem = async <T>(endpoint: string, id: string | number, data: any): Promise<{ success: boolean; message: string; data: T }> => {
  const response = await fetch(`${API_BASE_URL}/masters/${endpoint}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || `Failed to update ${endpoint}`);
  return result;
};

export const deleteMasterItem = async (endpoint: string, id: string | number): Promise<{ success: boolean; message: string }> => {
  const response = await fetch(`${API_BASE_URL}/masters/${endpoint}/${id}`, {
    method: "DELETE",
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || `Failed to delete ${endpoint}`);
  return result;
};

// ======================================================
// WAREHOUSE API CALLS
// ======================================================

export const fetchWarehouseList = async <T>(endpoint: string, params: { page?: number; limit?: number; search?: string }): Promise<MasterListResponse<T>> => {
  const query = new URLSearchParams();
  if (params.page) query.append("page", params.page.toString());
  if (params.limit) query.append("limit", params.limit.toString());
  if (params.search) query.append("search", params.search);

  const token = localStorage.getItem("token") || "";
  const response = await fetch(`${API_BASE_URL}/warehouse/${endpoint}?${query.toString()}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || `Failed to fetch warehouse ${endpoint}`);
  // Our backend just returns { success: true, data: [...] } for warehouse list instead of paginated response, so wrap it
  if (Array.isArray(result.data)) {
    return {
      success: true,
      data: {
        totalRecords: result.data.length,
        totalPages: 1,
        currentPage: 1,
        limit: 100,
        items: result.data
      }
    };
  }
  return result;
};

export const createWarehouseItem = async <T>(endpoint: string, data: any): Promise<{ success: boolean; message: string; data: T }> => {
  const token = localStorage.getItem("token") || "";
  const response = await fetch(`${API_BASE_URL}/warehouse/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || `Failed to create warehouse ${endpoint}`);
  return result;
};

export const updateWarehouseItem = async <T>(endpoint: string, id: string | number, data: any): Promise<{ success: boolean; message: string; data: T }> => {
  const token = localStorage.getItem("token") || "";
  const response = await fetch(`${API_BASE_URL}/warehouse/${endpoint}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || `Failed to update warehouse ${endpoint}`);
  return result;
};

export const deleteWarehouseItem = async (endpoint: string, id: string | number): Promise<{ success: boolean; message: string }> => {
  const token = localStorage.getItem("token") || "";
  const response = await fetch(`${API_BASE_URL}/warehouse/${endpoint}/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || `Failed to delete warehouse ${endpoint}`);
  return result;
};

export const fetchWarehouseOverview = async (): Promise<{ success: boolean; data: any }> => {
  const token = localStorage.getItem("token") || "";
  const response = await fetch(`${API_BASE_URL}/warehouse/overview`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || `Failed to fetch warehouse overview`);
  return result;
};

export const fetchWarehouseStock = async (warehouseId?: string): Promise<{ success: boolean; data: any[] }> => {
  const token = localStorage.getItem("token") || "";
  const query = warehouseId ? `?warehouse_id=${warehouseId}` : "";
  const response = await fetch(`${API_BASE_URL}/warehouse/stock${query}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || `Failed to fetch warehouse stock`);
  return result;
};

// ======================================================
// INVENTORY API CALLS
// ======================================================

export const fetchInventoryInStock = async (): Promise<{ success: boolean; data: any[] }> => {
  const token = localStorage.getItem("token") || "";
  const response = await fetch(`${API_BASE_URL}/inventory/in-stock`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || `Failed to fetch inventory in-stock`);
  return result;
};

export const fetchInventoryReorderLevel = async (): Promise<{ success: boolean; data: any[] }> => {
  const token = localStorage.getItem("token") || "";
  const response = await fetch(`${API_BASE_URL}/inventory/reorder-level`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || `Failed to fetch inventory reorder level`);
  return result;
};

// ======================================================
// ORDER API CALLS
// ======================================================

export const fetchOrderList = async <T>(endpoint: string, params: { page?: number; limit?: number; search?: string }): Promise<MasterListResponse<T>> => {
  const query = new URLSearchParams();
  if (params.page) query.append("page", params.page.toString());
  if (params.limit) query.append("limit", params.limit.toString());
  if (params.search) query.append("search", params.search);

  const token = localStorage.getItem("token") || "";
  const response = await fetch(`${API_BASE_URL}/orders/${endpoint}?${query.toString()}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || `Failed to fetch order ${endpoint}`);

  if (Array.isArray(result.data)) {
    return {
      success: true,
      data: {
        totalRecords: result.data.length,
        totalPages: 1,
        currentPage: 1,
        limit: 100,
        items: result.data
      }
    };
  }
  return result;
};

export const createOrderItem = async <T>(endpoint: string, data: any): Promise<{ success: boolean; message: string; data: T }> => {
  const token = localStorage.getItem("token") || "";
  const response = await fetch(`${API_BASE_URL}/orders/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || `Failed to create order ${endpoint}`);
  return result;
};

// ======================================================
// DASHBOARD API CALLS
// ======================================================

export const fetchDashboardStats = async (): Promise<{ success: boolean; data: any }> => {
  const token = localStorage.getItem("token") || "";
  const response = await fetch(`${API_BASE_URL}/dashboard/stats`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || `Failed to fetch dashboard stats`);
  return result;
};

// ======================================================
// WAREHOUSE USER ASSIGNMENT API CALLS
// ======================================================

export interface WarehouseAssignedUser {
  assignment_id: number;
  warehouse_id: number;
  user_id: number;
  first_name?: string;
  last_name?: string;
  username: string;
  email?: string;
  user_type?: string;
  is_active?: boolean;
  created_at?: string;
}

export const getWarehouseUsers = async (warehouseId: string | number): Promise<{ success: boolean; data: WarehouseAssignedUser[] }> => {
  const token = localStorage.getItem("token") || "";
  const response = await fetch(`${API_BASE_URL}/warehouse/${warehouseId}/users`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || "Failed to fetch warehouse users");
  return result;
};

export const assignUserToWarehouse = async (warehouseId: string | number, userId: string | number): Promise<{ success: boolean; message: string; data: any }> => {
  const token = localStorage.getItem("token") || "";
  const response = await fetch(`${API_BASE_URL}/warehouse/${warehouseId}/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ userId })
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || "Failed to assign user to warehouse");
  return result;
};

export const removeUserFromWarehouse = async (warehouseId: string | number, userId: string | number): Promise<{ success: boolean; message: string }> => {
  const token = localStorage.getItem("token") || "";
  const response = await fetch(`${API_BASE_URL}/warehouse/${warehouseId}/users/${userId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || "Failed to remove user from warehouse");
  return result;
};