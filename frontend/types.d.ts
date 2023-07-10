import { ReactNode } from 'react';

declare module '*.svg' {
  const ReactComponent: ReactNode;
}
