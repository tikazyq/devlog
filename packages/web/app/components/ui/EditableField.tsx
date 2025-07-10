'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Input, Select, Typography } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { MarkdownEditor } from './MarkdownEditor';
import styles from './EditableField.module.css';

const { TextArea } = Input;
const { Option } = Select;
const { Text } = Typography;

interface EditableFieldProps {
  value: string;
  onSave: (value: string) => void;
  multiline?: boolean;
  type?: 'text' | 'select' | 'textarea' | 'markdown';
  options?: { label: string; value: string }[];
  placeholder?: string;
  emptyText?: string;
  className?: string;
  size?: 'small' | 'middle' | 'large';
  draftMode?: boolean; // When true, doesn't auto-save on blur
  children: React.ReactNode;
}

export function EditableField({
  value,
  onSave,
  multiline = false,
  type = 'text',
  options = [],
  placeholder,
  emptyText,
  className,
  size = 'small',
  draftMode = true,
  children,
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isHovered, setIsHovered] = useState(false);
  const inputRef = useRef<any>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Update editValue when value prop changes
  useEffect(() => {
    setEditValue(value);
  }, [value]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

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

  const handleBlur = () => {
    handleBlurWithValue(editValue);
  };

  const handleBlurWithValue = (currentValue: string) => {
    if (draftMode) {
      // In draft mode, just save the local value and exit edit mode
      // The parent component will handle when to actually save
      if (currentValue !== value) {
        onSave(currentValue);
      }
      setIsEditing(false);
    } else {
      // Original behavior: save changes when losing focus
      handleSave();
    }
  };

  const handleEnterEdit = () => {
    setIsEditing(true);
  };

  useEffect(() => {
    if (type === 'select') {
      handleBlur();
    }
  }, [editValue]);

  const renderInput = () => {
    if (type === 'markdown') {
      return (
        <MarkdownEditor
          value={editValue}
          onChange={(value) => {
            setEditValue(value);
          }}
          onBlur={handleBlurWithValue}
          onCancel={handleCancel}
          placeholder={placeholder}
          autoFocus={true}
        />
      );
    }

    const inputProps = {
      ref: inputRef,
      value: editValue,
      onChange: (e: any) => {
        const newValue = e.target.value;
        setEditValue(newValue);
      },
      onKeyDown: handleKeyPress,
      onBlur: handleBlur,
      placeholder,
    };

    if (type === 'select') {
      return (
        <Select
          {...inputProps}
          size={size}
          open={isEditing}
          onChange={(newValue) => {
            setEditValue(newValue);
          }}
          style={{ width: '100%' }}
          variant="borderless"
        >
          {options.map((option) => (
            <Option key={option.value} value={option.value}>
              {option.label}
            </Option>
          ))}
        </Select>
      );
    } else if (type === 'textarea' || multiline) {
      return <TextArea {...inputProps} autoSize={{ minRows: 1 }} variant="borderless" />;
    } else {
      return <Input {...inputProps} variant="borderless" />;
    }
  };

  const renderContent = () => {
    if (showEmptyText && (!value || value.trim() === '')) {
      return (
        <Text type="secondary" className={styles.emptyFieldText}>
          {emptyText}
        </Text>
      );
    }

    return children;
  };

  if (isEditing) {
    return (
      <div className={`${styles.editableField} ${styles.editing} ${className}`}>
        {renderInput()}
      </div>
    );
  }

  // Show empty text if value is empty and emptyText is provided
  const showEmptyText = (!value || value.trim() === '') && emptyText;

  return (
    <div
      ref={contentRef}
      className={`${styles.editableField} ${isHovered ? styles.hovered : ''} ${className}`}
      onClick={handleEnterEdit}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title="Click to edit"
    >
      {renderContent()}
      <div className={styles.hoverOverlay}>
        <EditOutlined className={styles.editIcon} />
      </div>
    </div>
  );
}
