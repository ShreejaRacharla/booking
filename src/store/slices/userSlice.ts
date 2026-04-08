import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import customAxios from "../../utils/customAxios";

interface User {
  id: string;
  name: string;
}

interface UserState {
  items: User[];
  loading: boolean;
}

const initialState: UserState = {
  items: [],
  loading: false,
};

//  FETCH USERS
export const fetchUsers = createAsyncThunk("users/fetchAll", async () => {
  const res = await customAxios.get("/users");
  return Array.isArray(res.data)
    ? res.data
    : res.data.content ?? res.data.items ?? [];
});

const userSlice = createSlice({
  name: "users",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchUsers.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchUsers.fulfilled, (state, action) => {
      state.loading = false;
      state.items = action.payload;
    });
    builder.addCase(fetchUsers.rejected, (state) => {
      state.loading = false;
    });
  },
});

export default userSlice.reducer;