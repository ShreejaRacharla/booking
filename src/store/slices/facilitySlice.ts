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

// thunks
export const fetchFacilities = createAsyncThunk(
  "facilities/fetchAll",
  async () => {
    const response = await getFacilities();
    return response.data;
  }
);

export const createFacilityAPI = createAsyncThunk(
  "facilities/create",
  async (data: {
    name: string;
    capacity: number;
    locationId: string;
    approverUserId: string;
    type: FacilityType;
    isActive: boolean;
  }) => {
    const { type, isActive, ...apiPayload } = data;
    const response = await createFacility(apiPayload);
    return {
      ...response.data,
      type,
      isActive,
    } as Facility;
  }
);

export const updateFacilityAPI = createAsyncThunk(
  "facilities/update",
  async (data: {
    id: string;
    name: string;
    capacity: number;
    locationId: string;
    approverUserId: string;
    type: FacilityType;
    isActive: boolean;
  }) => {
    const { id, type, isActive, ...apiPayload } = data;
    const response = await updateFacility(id, apiPayload);
    return {
      ...response.data,
      type,
      isActive,
    } as Facility;
  }
);

export const deleteFacilityAPI = createAsyncThunk(
  "facilities/delete",
  async (id: string) => {
    await deleteFacility(id);
    return id;
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
      state.items = Array.isArray(action.payload)
        ? action.payload
        : action.payload.content ?? action.payload.items ?? [];
    });
    builder.addCase(fetchFacilities.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || "Failed to fetch facilities";
    });

    builder.addCase(createFacilityAPI.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(createFacilityAPI.fulfilled, (state, action) => {
      state.loading = false;
      state.items.push(action.payload);
    });
    builder.addCase(createFacilityAPI.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || "Failed to create facility";
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
    builder.addCase(updateFacilityAPI.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || "Failed to update facility";
    });

    builder.addCase(deleteFacilityAPI.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deleteFacilityAPI.fulfilled, (state, action) => {
      state.loading = false;
      state.items = state.items.filter((f) => f.id !== action.payload);
    });
    builder.addCase(deleteFacilityAPI.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || "Failed to delete facility";
    });
  },
});

export default facilitySlice.reducer;