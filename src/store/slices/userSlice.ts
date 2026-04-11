import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import customAxios from "../../utils/customAxios";

export interface User {
  id: string;
  name: string;
  email?: string;
  role?: string;
  isActive?: boolean;
}

interface UserState {
  items: User[];
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchUsers = createAsyncThunk(
  "users/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await customAxios.get("/users");
      console.log("🔍 Raw Users API Response:", res.data);

      let rawUsers: any[] = [];

      if (Array.isArray(res.data)) {
        rawUsers = res.data;
      } else if (res.data?.data && Array.isArray(res.data.data)) {
        rawUsers = res.data.data;
      } else if (res.data?.content && Array.isArray(res.data.content)) {
        rawUsers = res.data.content;
      } else if (res.data?.items && Array.isArray(res.data.items)) {
        rawUsers = res.data.items;
      }

      const users: User[] = rawUsers.map((u: any) => {
        const userId = u.id || u.userId || u.uuid || u.uid || "";
        const userName = u.username || u.name || u.firstName || "";

        console.log(`📦 Mapping user:`, {
          raw: u,
          mappedId: userId,
          mappedName: userName,
        });

        return {
          id: userId,
          name: userName,
          email: u.email,
          role: u.role || "user",
          isActive: u.enabled !== undefined ? u.enabled : u.isActive,
        };
      });

      console.log("✅ Mapped Users:", users);
      return users;
    } catch (err: any) {
      console.error("❌ Error fetching users:", err);
      return rejectWithValue(err?.message || "Failed to fetch users");
    }
  }
);

const userSlice = createSlice({
  name: "users",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchUsers.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchUsers.fulfilled, (state, action) => {
      state.loading = false;
      state.items = action.payload;
      console.log("✅ Users stored in Redux:", state.items);
    });
    builder.addCase(fetchUsers.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload;
      console.error("❌ Users fetch failed:", action.payload);
    });
  },
});

export default userSlice.reducer;