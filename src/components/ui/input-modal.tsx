'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface InputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (value: string) => void;
  title: string;
  description?: string;
  placeholder?: string;
  defaultValue?: string;
  inputType?: 'text' | 'textarea';
  confirmText?: string;
  cancelText?: string;
  required?: boolean;
}

export const InputModal: React.FC<InputModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  placeholder,
  defaultValue = '',
  inputType = 'text',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  required = true
}) => {
  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState('');

  // Reset value when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue);
      setError('');
    }
  }, [isOpen, defaultValue]);

  const handleConfirm = () => {
    const trimmedValue = value.trim();
    
    if (required && !trimmedValue) {
      setError('This field is required');
      return;
    }
    
    onConfirm(trimmedValue);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputType === 'text') {
      e.preventDefault();
      handleConfirm();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValue(e.target.value);
    if (error) setError(''); // Clear error when user starts typing
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <p className="text-sm text-gray-600 mt-2">{description}</p>
          )}
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="modal-input">
              {inputType === 'textarea' ? 'Content' : 'Name'}
            </Label>
            {inputType === 'textarea' ? (
              <Textarea
                id="modal-input"
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className={error ? 'border-red-500' : ''}
                rows={4}
                autoFocus
              />
            ) : (
              <Input
                id="modal-input"
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className={error ? 'border-red-500' : ''}
                autoFocus
              />
            )}
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
          </div>
        </div>
        
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
          >
            {cancelText}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={required && !value.trim()}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};