"use client";

import Button from "./Button";
import Modal from "../modals/Modal";
import { useEffect, useRef, useState, useTransition } from "react";
import Spinner from "../spinners/Spinner";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

const SyncButton = () => {
  const [open, setOpen] = useState(false);
  const [buttonDisabled, setButtonDisabled] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (isRefreshing && !isPending) {
      const timer = setTimeout(() => {
        setIsRefreshing(false);
        setOpen(false);
        setButtonDisabled(false);
        setProgress(0);
        setStatusMessage("");
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isRefreshing, isPending]);

  const handleClose = () => {
    controllerRef.current?.abort();
    setOpen(false);
    setButtonDisabled(false);
    setIsRefreshing(false);
    setProgress(0);
    setStatusMessage("");
    setErrorMessage("");
  };

  const handleSync = async () => {
    controllerRef.current?.abort();

    const controller = new AbortController();
    controllerRef.current = controller;

    setOpen(true);
    setButtonDisabled(true);
    setProgress(0);
    setStatusMessage("Starting...");
    setErrorMessage("");
    setIsRefreshing(false);

    await sync(controller);
  };

  const sync = async (controller: AbortController) => {
    let syncFailed = false;

    try {
      const response = await fetch("/api/sync/github", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        let serverError = `Sync failed (${response.status})`;
        try {
          const errData = await response.json();
          if (errData?.error) serverError = errData.error;
        } catch {
          // Ignore non-JSON error body
        }
        throw new Error(serverError);
      }

      if (!response.body) {
        throw new Error("ReadableStream not supported in this browser.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          try {
            const data = JSON.parse(trimmed);
            if (data.error) {
              throw new Error(data.error);
            }
            if (typeof data.progress === "number") {
              setProgress(data.progress);
            }
            if (data.message) {
              setStatusMessage(data.message);
            }
          } catch (e) {
            if (e instanceof SyntaxError) {
              console.error("Error parsing JSON line:", e);
            } else {
              throw e;
            }
          }
        }
      }

      if (buffer.trim()) {
        try {
          const data = JSON.parse(buffer.trim());
          if (data.error) throw new Error(data.error);
          if (typeof data.progress === "number") setProgress(data.progress);
          if (data.message) setStatusMessage(data.message);
        } catch (e) {
          if (!(e instanceof SyntaxError)) throw e;
        }
      }

      setIsRefreshing(true);
      setStatusMessage("Refreshing dashboard data...");
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      syncFailed = true;
      if (error instanceof Error && error.name === "AbortError") {
        setOpen(false);
        setButtonDisabled(false);
      } else {
        setErrorMessage(
          error instanceof Error ? error.message : "Failed to sync with GitHub",
        );
        setButtonDisabled(false);
      }
    } finally {
      if (controllerRef.current === controller) {
        controllerRef.current = null;
      }
      if (!syncFailed && controller.signal.aborted) {
        setIsRefreshing(false);
        setOpen(false);
        setButtonDisabled(false);
        setProgress(0);
        setStatusMessage("");
      }
    }
  };

  return (
    <>
      <Button onClick={handleSync} disabled={buttonDisabled}>
        <RefreshCw className={`w-3.5 h-3.5 ${buttonDisabled ? "animate-spin" : ""}`} />
        Sync Github Now
      </Button>
      <Modal
        open={open}
        title={
          errorMessage
            ? "Sync Failed"
            : isRefreshing
              ? "Refreshing Data..."
              : "Synchronizing..."
        }
        body={
          <div className="flex flex-col gap-4 items-center justify-center w-full min-w-[300px]">
            {errorMessage ? (
              <>
                <p className="text-sm text-rose-600 text-center font-medium">{errorMessage}</p>
                <Button onClick={handleClose}>Close</Button>
              </>
            ) : isRefreshing ? (
              <>
                <Spinner size={3} />
                <p className="text-sm text-ink-muted">{statusMessage}</p>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-ink tabular-nums">{progress}%</h2>
                <p className="text-sm text-ink-muted">{statusMessage || "Starting..."}</p>
                <div className="w-full bg-canvas rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-ink h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </>
            )}
          </div>
        }
        onClose={handleClose}
      />
    </>
  );
};

export default SyncButton;
