"use client";

import Button from "./Button";
import Modal from "../modals/Modal";
import { useState } from "react";
import Spinner from "../spinners/Spinner";

const SyncButton = () => {
  const [open, setOpen] = useState(false);

  const handleClose = () => {
    setOpen(false);
  };

  const handleSync = () => {
    setOpen(true);
    sync();

    setTimeout(() => {
      setOpen(false);
    }, 2000);
  };

  const sync = async () => {
    try {
      const response = await fetch("/api/sync/github", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      <Button onClick={handleSync}>Sync Now</Button>
      <Modal
        open={open}
        title="Synchronizing..."
        body={
          <div className="flex items-center justify-center">
            <Spinner size={3} />
          </div>
        }
        onClose={handleClose}
      />
    </>
  );
};

export default SyncButton;
