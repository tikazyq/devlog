import React from 'react';
import { Layout, Button, Space, Badge, Typography } from 'antd';
import { ReloadOutlined, WifiOutlined } from '@ant-design/icons';

const { Header: AntHeader } = Layout;
const { Text } = Typography;

interface HeaderProps {
  connected: boolean;
  onRefresh: () => void;
}

export function Header({ connected, onRefresh }: HeaderProps) {
  return (
    <AntHeader style={{ 
      padding: '0 24px', 
      background: '#fff', 
      borderBottom: '1px solid #f0f0f0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      <Typography.Title level={3} style={{ margin: 0, color: '#1f2937' }}>
        Devlog Dashboard
      </Typography.Title>
      
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
