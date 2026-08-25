import React from "react";
import { FaCircleCheck, FaFloppyDisk, FaSpinner } from "react-icons/fa6";
import ModalBackdrop from "./ModalBackdrop";

interface ConfirmActionModalProps {
  open: boolean;
  title: string;
  message: string;
  targetLabel?: string;
  confirmLabel: string;
  cancelLabel: string;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

const ConfirmActionModal: React.FC<ConfirmActionModalProps> = ({
  open,
  title,
  message,
  targetLabel,
  confirmLabel,
  cancelLabel,
  loading = false,
  onConfirm,
  onClose,
}) => (
  <ModalBackdrop
    onOpen={open}
    onClose={onClose}
    dismissible={!loading}
    size="sm"
    label={title}
  >
    <div className="confirm-modal confirm-modal--primary">
      <h2 className="confirm-modal__title">
        <FaCircleCheck aria-hidden/>
        {title}
      </h2>
      <p className="confirm-modal__subtitle mt-3">{message}</p>
      {targetLabel && <div className="confirm-modal__target confirm-modal__target--primary">{targetLabel}</div>}
      <div className="confirm-modal__actions">
        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
          {cancelLabel}
        </button>
        <button type="button" className="btn btn-primary" onClick={onConfirm} disabled={loading}>
          {loading ? <FaSpinner className="confirm-modal__spinner" aria-hidden/> : <FaFloppyDisk aria-hidden/>}
          {confirmLabel}
        </button>
      </div>
    </div>
  </ModalBackdrop>
);

export default ConfirmActionModal;
