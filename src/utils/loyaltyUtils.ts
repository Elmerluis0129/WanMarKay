import dayjs from 'dayjs';
import { User } from '../types/user';
import React, { ReactElement } from 'react';
import { Star as StarIcon, Loyalty as LoyaltyIcon, EmojiEvents as EmojiEventsIcon } from '@mui/icons-material';

export type LoyaltyTier = {
  id: string;
  name: string;
  minDays: number;
  maxDays?: number;
  color: string;
  icon: () => ReactElement<any, any>;
  description: string;
};

export const loyaltyTiers: LoyaltyTier[] = [
  {
    id: 'new',
    name: 'Nuevo',
    minDays: 0,
    maxDays: 90,
    color: '#4CAF50',
    icon: () => React.createElement(StarIcon),
    description: 'Clientes nuevos que están conociendo nuestros productos.'
  },
  {
    id: 'loyal',
    name: 'Leal',
    minDays: 91,
    maxDays: 365,
    color: '#2196F3',
    icon: () => React.createElement(LoyaltyIcon),
    description: 'Clientes frecuentes que disfrutan de beneficios exclusivos.'
  },
  {
    id: 'veteran',
    name: 'Veterano',
    minDays: 366,
    maxDays: 730,
    color: '#9C27B0',
    icon: () => React.createElement(EmojiEventsIcon),
    description: 'Clientes de larga data con beneficios premium.'
  },
  {
    id: 'ambassador',
    name: 'Embajador',
    minDays: 731,
    color: '#FF9800',
    icon: () => React.createElement(EmojiEventsIcon, { style: { color: '#FF9800' } }),
    description: 'Nuestros clientes más valiosos y embajadores de la marca.'
  }
];

export function getLoyaltyTierForUser(user: User) {
  if (!user.createdAt) return loyaltyTiers[0];
  const today = dayjs();
  const joinDate = dayjs(user.createdAt);
  if (!joinDate.isValid()) return loyaltyTiers[0];
  const diffDays = today.diff(joinDate, 'day');
  return (
    loyaltyTiers.find(tier =>
      tier.maxDays ? diffDays >= tier.minDays && diffDays <= tier.maxDays : diffDays >= tier.minDays
    ) || loyaltyTiers[0]
  );
}
