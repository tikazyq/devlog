import React from 'react';
import { Layout, Button, Space, Badge, Typography } from 'antd';
import { ReloadOutlined, WifiOutlined, MenuOutlined } from '@ant-design/icons';

const { Header: AntHeader } = Layout;
const { Text } = Typography;

interface HeaderProps {
  connected: boolean;
  onRefresh: () => void;
  sidebarCollapsed?: boolean;
  onSidebarToggle?: () => void;
}

export function Header({ connected, onRefresh, sidebarCollapsed, onSidebarToggle }: HeaderProps) {
  return (
    <AntHeader className="header-container">
      <div className="header-left">
        {onSidebarToggle && (
          <Button 
            type="text"
            icon={<MenuOutlined />}
            onClick={onSidebarToggle}
            className="mobile-menu-button"
          />
        )}
        <Typography.Title level={3} className="header-title">
          Devlog Dashboard
        </Typography.Title>
      </div>
      
      <Space size="middle">
        <Space size="small">
          <Badge 
            status={connected ? 'success' : 'error'} 
            text={
              <Text type={connected ? 'success' : 'danger'}>
                {connected ? 'Connected' : 'Disconnected'}
              </Text>
            }
          />
          <WifiOutlined style={{ color: connected ? '#52c41a' : '#ff4d4f' }} />
        </Space>
        
        <Button 
          icon={<ReloadOutlined />}
          onClick={onRefresh}
          type="default"
        >
          Refresh
        </Button>
      </Space>
    </AntHeader>
  );
}
