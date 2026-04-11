import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { SlotEntry } from "../../types";
import {
  getAvailability,
  getAvailabilityByFacility,
  generateAvailability,
  addAvailabilitySlot,
  updateAvailability,
  blockAvailability,
  unblockAvailability,
} from "../../services/api";

interface slotState {
  entries: SlotEntry[];
  loading: boolean;
  error: string | null;
}

const initialState: slotState = {
  entries: [],
  loading: false,
  error: null,
};

export const fetchAvailability = createAsyncThunk(
  "slot/fetch",
  async (params?: {
    locationId?: string;
    facilityId?: string;
    fromDate?: string;
    toDate?: string;
  }) => {
    const response = await getAvailability(params);
    return response.data;
  }
);

export const fetchAvailabilityByFacility = createAsyncThunk(
  "slot/fetchByFacility",
  async (data: { facilityId: string; fromDate: string; toDate: string }) => {
    const response = await getAvailabilityByFacility(
      data.facilityId,
      data.fromDate,
      data.toDate
    );
    return response.data;
  }
);

export const generateAvailabilityAPI = createAsyncThunk(
  "slot/generate",
  async (data: {
    locationName: string;
    facilityName: string;
    fromDate: string;
    toDate: string;
    daysOfWeek: string[];
    slotIds: string[];
    pricePerSlot: number;
  }) => {
    const response = await generateAvailability(data);
    return response.data;
  }
);

export const addAvailabilitySlotAPI = createAsyncThunk(
  "slot/addSlot",
  async (data: {
    facilityId: string;
    date: string;
    slotId: string;
    price: number;
  }) => {
    const response = await addAvailabilitySlot(data);
    return response.data;
  }
);

export const updateAvailabilityAPI = createAsyncThunk(
  "slot/update",
  async (data: {
    facilityId: string;
    fromDate: string;
    toDate: string;
    slotIds: string[];
    price: number;
  }) => {
    const response = await updateAvailability(data);
    return response.data;
  }
);

export const blockAvailabilityAPI = createAsyncThunk(
  "slot/block",
  async (data: {
    facilityId: string;
    slots: { date: string; slotId: string }[];
    reason: string;
  }) => {
    const response = await blockAvailability(data);
    return { ...response.data, reason: data.reason, slots: data.slots };
  }
);

export const unblockAvailabilityAPI = createAsyncThunk(
  "slot/unblock",
  async (data: {
    facilityId: string;
    slots: { date: string; slotId: string }[];
  }) => {
    const response = await unblockAvailability(data);
    return { ...response.data, slots: data.slots };
  }
);

const slotSlice = createSlice({
  name: "slot",
  initialState,
  reducers: {
    generateslot(state, action: PayloadAction<SlotEntry[]>) {
      const newEntries = action.payload.filter(
        (ne) =>
          !state.entries.some(
            (e) =>
              e.facilityId === ne.facilityId &&
              e.date === ne.date &&
              e.timeslotId === ne.timeslotId
          )
      );
      state.entries.push(...newEntries);
    },
    blockSlots(
      state,
      action: PayloadAction<{ ids: string[]; reason: string }>
    ) {
      action.payload.ids.forEach((id) => {
        const entry = state.entries.find((e) => e.id === id);
        if (entry && entry.status === "AVAILABLE") {
          entry.status = "BLOCKED";
          entry.blockReason = action.payload.reason;
        }
      });
    },
    unblockSlots(state, action: PayloadAction<string[]>) {
      action.payload.forEach((id) => {
        const entry = state.entries.find((e) => e.id === id);
        if (entry && entry.status === "BLOCKED") {
          entry.status = "AVAILABLE";
          entry.blockReason = undefined;
        }
      });
    },
    updateSlotStatus(
      state,
      action: PayloadAction<{ id: string; status: SlotEntry["status"] }>
    ) {
      const entry = state.entries.find((e) => e.id === action.payload.id);
      if (entry) entry.status = action.payload.status;
    },
    clearSlots(state) {
      state.entries = [];
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchAvailability.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchAvailability.fulfilled, (state, action) => {
      state.loading = false;
      const entries: SlotEntry[] = Array.isArray(action.payload)
        ? action.payload
        : action.payload.content ?? action.payload.items ?? [];
      state.entries = entries;
    });
    builder.addCase(fetchAvailability.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || "Failed to fetch availability";
    });

    builder.addCase(fetchAvailabilityByFacility.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchAvailabilityByFacility.fulfilled, (state, action) => {
      state.loading = false;
      const entries: SlotEntry[] = Array.isArray(action.payload)
        ? action.payload
        : action.payload.content ?? action.payload.items ?? [];
      state.entries = entries;
    });
    builder.addCase(fetchAvailabilityByFacility.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || "Failed to fetch availability";
    });

    // Generate
    builder.addCase(generateAvailabilityAPI.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(generateAvailabilityAPI.fulfilled, (state, action) => {
      state.loading = false;
      const newEntries: SlotEntry[] = Array.isArray(action.payload)
        ? action.payload
        : action.payload.entries ?? [];
      newEntries.forEach((ne) => {
        const exists = state.entries.some((e) => e.id === ne.id);
        if (!exists) state.entries.push(ne);
      });
    });
    builder.addCase(generateAvailabilityAPI.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || "Failed to generate availability";
    });

    // Block
    builder.addCase(blockAvailabilityAPI.fulfilled, (state, action) => {
      const { slots, reason } = action.payload as {
        slots: { date: string; slotId: string }[];
        reason: string;
      };
      slots?.forEach(({ date, slotId }) => {
        const entry = state.entries.find(
          (e) => e.date === date && e.timeslotId === slotId
        );
        if (entry) {
          entry.status = "BLOCKED";
          entry.blockReason = reason;
        }
      });
    });

    // Unblock
    builder.addCase(unblockAvailabilityAPI.fulfilled, (state, action) => {
      const { slots } = action.payload as {
        slots: { date: string; slotId: string }[];
      };
      slots?.forEach(({ date, slotId }) => {
        const entry = state.entries.find(
          (e) => e.date === date && e.timeslotId === slotId
        );
        if (entry) {
          entry.status = "AVAILABLE";
          entry.blockReason = undefined;
        }
      });
    });
  },
});

export const {
  generateslot,
  blockSlots,
  unblockSlots,
  updateSlotStatus,
  clearSlots,
} = slotSlice.actions;
export default slotSlice.reducer;