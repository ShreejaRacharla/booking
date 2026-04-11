import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { Club } from "../../types";
import { getClubs, createClub, updateClub, deleteClub } from "../../services/api";

interface ClubState {
  items: Club[];
  loading: boolean;
  error: string | null;
}

const initialState: ClubState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchClubs = createAsyncThunk("clubs/fetchAll", async () => {
  const response = await getClubs();
  return response.data;
});

export const createClubAPI = createAsyncThunk(
  "clubs/create",
  async (data: { name: string; isActive?: boolean }) => {
    const response = await createClub(data);
    return response.data;
  }
);

export const updateClubAPI = createAsyncThunk(
  "clubs/update",
  async (data: { id: string; name: string; isActive: boolean }) => {
    const { id, ...updateData } = data;
    const response = await updateClub(id, updateData);
    return response.data;
  }
);

export const deleteClubAPI = createAsyncThunk(
  "clubs/delete",
  async (id: string) => {
    await deleteClub(id);
    return id;
  }
);

const clubSlice = createSlice({
  name: "clubs",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchClubs.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchClubs.fulfilled, (state, action) => {
      state.loading = false;
      state.items = Array.isArray(action.payload)
        ? action.payload
        : action.payload.content ?? action.payload.items ?? [];
    });
    builder.addCase(fetchClubs.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || "Failed to fetch clubs";
    });

    builder.addCase(createClubAPI.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(createClubAPI.fulfilled, (state, action) => {
      state.loading = false;
      state.items.push(action.payload);
    });
    builder.addCase(createClubAPI.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || "Failed to create club";
    });

    builder.addCase(updateClubAPI.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateClubAPI.fulfilled, (state, action) => {
      state.loading = false;
      const idx = state.items.findIndex((c) => c.id === action.payload.id);
      if (idx !== -1) {
        state.items[idx] = action.payload;
      }
    });
    builder.addCase(updateClubAPI.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || "Failed to update club";
    });

    builder.addCase(deleteClubAPI.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deleteClubAPI.fulfilled, (state, action) => {
      state.loading = false;
      state.items = state.items.filter((c) => c.id !== action.payload);
    });
    builder.addCase(deleteClubAPI.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || "Failed to delete club";
    });
  },
});

export default clubSlice.reducer;