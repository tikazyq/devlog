'use client';

import React, { useState } from 'react';
import { Button, Input, Select } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import styles from './EditableField.module.css';

const { TextArea } = Input;
const { Option } = Select;

interface EditableFieldProps {
  value: string;
  onSave: (value: string) => void;
  multiline?: boolean;
  type?: 'text' | 'select' | 'textarea';
  options?: { label: string; value: string }[];
  placeholder?: string;
  children: React.ReactNode;
}

export function EditableField({
  value,
  onSave,
  multiline = false,
  type = 'text',
  options = [],
  placeholder,
  children,
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  const handleSave = () => {
    onSave(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className={`${styles.editableField} ${styles.editing}`}>
        {type === 'select' ? (
          <Select value={editValue} onChange={setEditValue} style={{ width: '100%' }} autoFocus>
            {options.map((option) => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        ) : type === 'textarea' || multiline ? (
          <TextArea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyPress}
            autoFocus
            placeholder={placeholder}
          />
        ) : (
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyPress}
            autoFocus
            placeholder={placeholder}
          />
        )}
        <div className={styles.fieldActions}>
          <Button size="small" onClick={handleCancel} icon={<CloseOutlined />}>
            Cancel
          </Button>
          <Button size="small" type="primary" onClick={handleSave} icon={<CheckOutlined />}>
            Save
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.editableField} onClick={() => setIsEditing(true)} title="Click to edit">
      {children}
    </div>
  );
}
