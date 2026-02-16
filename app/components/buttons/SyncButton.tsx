"use client";

import Button from "./Button";
import Modal from "../modals/Modal";
import { useRef, useState } from "react";
import Spinner from "../spinners/Spinner";
import { useRouter } from "next/navigation";

const SyncButton = () => {
  const [open, setOpen] = useState(false);
  const [buttonDisabled, setButtonDisabled] = useState(false);
  const [isReloading, setIsReloading] = useState(false);

  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");

  const router = useRouter();

  const controllerRef = useRef<AbortController | null>(null);

  const handleClose = () => {
    controllerRef.current?.abort();
    setOpen(false);
    setButtonDisabled(false);
    setProgress(0);
    setStatusMessage("");
  };

  const handleSync = async () => {
    controllerRef.current?.abort();

    const controller = new AbortController();
    controllerRef.current = controller;

    setOpen(true);
    setButtonDisabled(true);
    setProgress(0);
    setIsReloading(false);
    
    await sync(controller);
  };

  const sync = async (controller: AbortController) => {
    try {
      const response = await fetch("/api/sync/github", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });

      if (!response.body) {
        throw new Error("ReadableStream not supported in this browser.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        // Handle multiple JSON objects in one chunk
        const lines = chunk.split("\n").filter((line) => line.trim() !== "");

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.error) {
               console.error("Sync error from server:", data.error);
            }
            if (data.progress) {
              setProgress(data.progress);
            }
            if (data.message) {
              setStatusMessage(data.message);
            }
          } catch (e) {
            console.error("Error parsing JSON chunk:", e);
          }
        }
      }

      setIsReloading(true);
      setStatusMessage("Reloading page...");

      router.refresh();
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.log("Fetch aborted");
      } else {
        console.log(error);
      }
    } finally {
      if (controllerRef.current === controller) {
        controllerRef.current = null;
      }
      
      // Only close if we are not reloading (which means sync finished successfully)
      // Actually we want to keep it open while reloading? 
      // Existing logic closed it. Let's keep it consistent but maybe delay closing?
      // The original code set isReloading=true then refreshed.
      // Refresh might take a moment.
      
      if (!controller.signal.aborted) {
          // If not aborted, we are likely reloading.
          // We can close the modal after a short delay or let the page reload handle it.
          // Original code:
          // setIsReloading(false);
          // setOpen(false);
          // setButtonDisabled(false);
          
          // Let's reset but keep it open for a bit if we want user to see "100%"
          setTimeout(() => {
             setIsReloading(false);
             setOpen(false);
             setButtonDisabled(false);
             setProgress(0);
             setStatusMessage("");
          }, 1000);
      } else {
        // Aborted
        setIsReloading(false);
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
        Sync Now
      </Button>
      <Modal
        open={open}
        title={isReloading ? "Reloading..." : "Synchronizing..."}
        body={
          <div className="flex flex-col gap-4 items-center justify-center w-full min-w-[300px]">
            {isReloading ? (
                 <Spinner size={3} />
            ) : (
                <>
                    <h2 className="text-xl font-bold">{progress}%</h2>
                    <p className="text-sm text-gray-400">{statusMessage || "Starting..."}</p>
                    <div className="w-full bg-gray-700 rounded-full h-2.5 dark:bg-gray-700">
                        <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
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
