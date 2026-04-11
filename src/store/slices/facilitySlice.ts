import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { Facility, FacilityType } from "../../types";
import { getFacilities, createFacility, updateFacility, deleteFacility } from "../../services/api";

interface FacilityState {
  items: Facility[];
  loading: boolean;
  error: string | null;
}

const initialState: FacilityState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchFacilities = createAsyncThunk(
  "facilities/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getFacilities();
      return Array.isArray(response.data)
        ? response.data
        : response.data.content ?? response.data.items ?? response.data.data ?? [];
    } catch (err: any) {
      return rejectWithValue(err?.message || "Failed to fetch facilities");
    }
  }
);

export const createFacilityAPI = createAsyncThunk(
  "facilities/create",
  async (
    data: {
      name: string;
      capacity: number;
      locationId: string;
      approverUserId: string;
      type: FacilityType;
      isActive: boolean;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await createFacility({
        name: data.name,
        capacity: data.capacity,
        locationId: data.locationId,
        approverUserId: data.approverUserId,
      });
      return {
        ...response.data,
        type: data.type,
        isActive: data.isActive,
      } as Facility;
    } catch (err: any) {
      return rejectWithValue(err?.message || "Failed to create facility");
    }
  }
);

export const updateFacilityAPI = createAsyncThunk(
  "facilities/update",
  async (
    data: {
      id: string;
      name: string;
      capacity: number;
      locationId: string;
      approverUserId: string;
      type: FacilityType;
      isActive: boolean;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await updateFacility(data.id, {
        name: data.name,
        capacity: data.capacity,
        locationId: data.locationId,
        approverUserId: data.approverUserId,
      });
      return {
        ...response.data,
        type: data.type,
        isActive: data.isActive,
      } as Facility;
    } catch (err: any) {
      return rejectWithValue(err?.message || "Failed to update facility");
    }
  }
);

export const deleteFacilityAPI = createAsyncThunk(
  "facilities/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      await deleteFacility(id);
      return id;
    } catch (err: any) {
      return rejectWithValue(err?.message || "Failed to delete facility");
    }
  }
);

const facilitySlice = createSlice({
  name: "facilities",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchFacilities.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchFacilities.fulfilled, (state, action) => {
      state.loading = false;
      state.items = action.payload;
    });
    builder.addCase(fetchFacilities.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload;
    });

    builder.addCase(createFacilityAPI.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(createFacilityAPI.fulfilled, (state, action) => {
      state.loading = false;
      state.items.push(action.payload);
    });
    builder.addCase(createFacilityAPI.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload;
    });

    builder.addCase(updateFacilityAPI.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateFacilityAPI.fulfilled, (state, action) => {
      state.loading = false;
      const idx = state.items.findIndex((f) => f.id === action.payload.id);
      if (idx !== -1) {
        state.items[idx] = action.payload;
      }
    });
    builder.addCase(updateFacilityAPI.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload;
    });

    builder.addCase(deleteFacilityAPI.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deleteFacilityAPI.fulfilled, (state, action) => {
      state.loading = false;
      state.items = state.items.filter((f) => f.id !== action.payload);
    });
    builder.addCase(deleteFacilityAPI.rejected, (state, action: any) => {
      state.loading = false;
      state.error = action.payload;
    });
  },
});

export default facilitySlice.reducer;