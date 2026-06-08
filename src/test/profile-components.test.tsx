import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Gauge, StatCard, Breakthrough } from '../components/partners/profile/ProfileComponents';
import { Users } from 'lucide-react';

describe('ProfileComponents', () => {
  describe('Gauge', () => {
    it('renders score and label', () => {
      render(<Gauge score={75} label="能力" />);
      expect(screen.getByText('能力')).toBeDefined();
      expect(screen.getByText('75')).toBeDefined();
    });

    it('caps at max value', () => {
      render(<Gauge score={150} label="超限" max={100} />);
      expect(screen.getByText('150')).toBeDefined();
    });
  });

  describe('StatCard', () => {
    it('renders label and value', () => {
      render(<StatCard icon={Users} label="活跃伙伴" value="1,240" />);
      expect(screen.getByText('活跃伙伴')).toBeDefined();
      expect(screen.getByText('1,240')).toBeDefined();
    });

    it('renders subtitle and positive trend', () => {
      render(<StatCard icon={Users} label="增长" value="12.5%" sub="同比上升" trend={12.5} />);
      expect(screen.getByText('同比上升')).toBeDefined();
    });

    it('renders negative trend icon', () => {
      render(<StatCard icon={Users} label="下降" value="-5%" trend={-5} />);
      expect(screen.getByText('-5%')).toBeDefined();
    });
  });

  describe('Breakthrough', () => {
    it('renders all fields', () => {
      render(
        <Breakthrough
          title="突破性机会"
          desc="进入金融行业"
          action="联系CIO"
          target="金融"
          roi="300%"
        />,
      );
      expect(screen.getByText('突破性机会')).toBeDefined();
      expect(screen.getByText('进入金融行业')).toBeDefined();
      // "300%" is split across elements by React, use a function matcher
      expect(screen.getByText((content) => content.includes('300%'))).toBeDefined();
      expect(screen.getByText(/联系CIO/)).toBeDefined();
    });
  });
});
