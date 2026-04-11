import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { Location } from "../../types";
import { getLocations, createLocation, updateLocation, deleteLocation } from "../../services/api";

interface LocationState {
  items: Location[];
  loading: boolean;
  error: string | null;
}

const initialState: LocationState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchLocations = createAsyncThunk(
  "locations/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getLocations();
      return Array.isArray(response.data)
        ? response.data
        : response.data.content ?? response.data.items ?? [];
    } catch (err: any) {
      return rejectWithValue(err?.message);
    }
  }
);

export const createLocationAPI = createAsyncThunk(
  "locations/create",
  async (
    data: { name: string; approverUserId: string; isActive?: boolean },
    { rejectWithValue }
  ) => {
    try {
      const response = await createLocation(data);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err?.message);
    }
  }
);

export const updateLocationAPI = createAsyncThunk(
  "locations/update",
  async (
    data: { id: string; name: string; approverUserId: string; isActive: boolean },
    { rejectWithValue }
  ) => {
    try {
      const { id, ...payload } = data;
      const response = await updateLocation(id, payload);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err?.message);
    }
  }
);

export const deleteLocationAPI = createAsyncThunk(
  "locations/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      await deleteLocation(id);
      return id;
    } catch (err: any) {
      return rejectWithValue(err?.message);
    }
  }
);

const locationSlice = createSlice({
  name: "locations",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchLocations.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchLocations.fulfilled, (state, action) => {
      state.loading = false;
      state.items = action.payload;
    });
    builder.addCase(fetchLocations.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload;
    });

    builder.addCase(createLocationAPI.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(createLocationAPI.fulfilled, (state, action) => {
      state.loading = false;
      state.items.push(action.payload);
    });
    builder.addCase(createLocationAPI.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload;
    });

    builder.addCase(updateLocationAPI.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateLocationAPI.fulfilled, (state, action) => {
      state.loading = false;
      const idx = state.items.findIndex((l) => l.id === action.payload.id);
      if (idx !== -1) {
        state.items[idx] = action.payload;
      }
    });
    builder.addCase(updateLocationAPI.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload;
    });

    builder.addCase(deleteLocationAPI.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deleteLocationAPI.fulfilled, (state, action) => {
      state.loading = false;
      state.items = state.items.filter((l) => l.id !== action.payload);
    });
    builder.addCase(deleteLocationAPI.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload;
    });
  },
});

export default locationSlice.reducer;