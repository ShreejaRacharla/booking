import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { TimeSlot } from "../../types";
import { getTimeslots, createTimeslot, updateTimeslot, deleteTimeslot } from "../../services/api";

interface TimeslotState {
  items: TimeSlot[];
  loading: boolean;
  error: string | null;
}

const initialState: TimeslotState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchTimeslots = createAsyncThunk(
  "timeslots/fetchAll",
  async () => {
    const response = await getTimeslots();
    return response.data;
  }
);

export const createTimeslotAPI = createAsyncThunk(
  "timeslots/create",
  async (data: {
    name: string;
    startTime: string;
    endTime: string;
    facilityId: string;
    isActive: boolean;
  }) => {
    const response = await createTimeslot(data);
    return response.data;
  }
);

export const updateTimeslotAPI = createAsyncThunk(
  "timeslots/update",
  async (data: {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
    facilityId: string;
    isActive: boolean;
  }) => {
    const { id, ...payload } = data;
    const response = await updateTimeslot(id, payload);
    return response.data;
  }
);

export const deleteTimeslotAPI = createAsyncThunk(
  "timeslots/delete",
  async (id: string) => {
    await deleteTimeslot(id);
    return id;
  }
);

const timeslotSlice = createSlice({
  name: "timeslots",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchTimeslots.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchTimeslots.fulfilled, (state, action) => {
      state.loading = false;
      state.items = Array.isArray(action.payload)
        ? action.payload
        : action.payload.content ?? action.payload.items ?? [];
    });
    builder.addCase(fetchTimeslots.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || "Failed to fetch timeslots";
    });

    builder.addCase(createTimeslotAPI.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(createTimeslotAPI.fulfilled, (state, action) => {
      state.loading = false;
      state.items.push(action.payload);
    });
    builder.addCase(createTimeslotAPI.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || "Failed to create timeslot";
    });

    builder.addCase(updateTimeslotAPI.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateTimeslotAPI.fulfilled, (state, action) => {
      state.loading = false;
      const idx = state.items.findIndex((t) => t.id === action.payload.id);
      if (idx !== -1) {
        state.items[idx] = action.payload;
      }
    });
    builder.addCase(updateTimeslotAPI.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || "Failed to update timeslot";
    });

    builder.addCase(deleteTimeslotAPI.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deleteTimeslotAPI.fulfilled, (state, action) => {
      state.loading = false;
      state.items = state.items.filter((t) => t.id !== action.payload);
    });
    builder.addCase(deleteTimeslotAPI.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || "Failed to delete timeslot";
    });
  },
});

export default timeslotSlice.reducer;