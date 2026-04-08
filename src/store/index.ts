import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import timeslotReducer from "./slices/timeslotSlice";
import locationReducer from "./slices/locationSlice";
import clubReducer from "./slices/clubSlice";
import facilityReducer from "./slices/facilitySlice";
import slotReducer from "./slices/slotSlice";
import bookingReducer from "./slices/bookingSlice";
import userReducer from "./slices/userSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    timeslots: timeslotReducer,
    locations: locationReducer,
    clubs: clubReducer,
    facilities: facilityReducer,
    slot: slotReducer,
    bookings: bookingReducer,
    users: userReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;