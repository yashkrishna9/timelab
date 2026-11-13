'use client';

import React from 'react';
import * as Icons from 'lucide-react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  name: string;
  size?: number;
  className?: string;
}

export default function Icon({ name, size = 18, className = '', ...props }: IconProps) {
  // @ts-expect-error dynamic lookup in Icons record
  const Component = Icons[name] || Icons.CircleDot;
  return <Component size={size} className={className} {...props} />;
}
