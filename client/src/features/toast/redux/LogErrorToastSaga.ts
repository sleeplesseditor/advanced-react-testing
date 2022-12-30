import { PayloadAction } from "@reduxjs/toolkit";
import { SagaIterator } from "redux-saga";
import { call, put, takeEvery } from "redux-saga/effects";

import { ToastOptions } from "../types";
import { showToast } from "./toastSlice";

export const sendToAnalytics = (title: string): void => {
  // Send data to analytics engine
};

export function* logErrorToasts({
  payload,
}: PayloadAction<ToastOptions>): SagaIterator {
  const { title, status } = payload;
  if (status === "error") {
    yield call(sendToAnalytics, title);
  }
  yield put(showToast({ title, status }));
}

// not very useful, didn't bother adding to root saga
export function* watchToasts(): SagaIterator {
  yield takeEvery(showToast.type, logErrorToasts);
}
