import React, { forwardRef, AnchorHTMLAttributes, ElementType } from 'react';
import { Link as ReactRouterLink } from 'react-router-dom';

const IS_EXTERNAL_LINK_REGEX = /^(?:[a-z][a-z\d+.-]*:|\/\/)/;

interface LinkAdapterProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  url?: string;
  to?: string;
  external?: boolean;
  component?: ElementType;
  children: React.ReactNode;
}

export const LinkAdapter = forwardRef<HTMLAnchorElement, LinkAdapterProps>(({ children, url, to, external, component, ...rest }, ref) => {
  const destination = url || to || '';
  const isExternal = external || IS_EXTERNAL_LINK_REGEX.test(destination);

  if (isExternal) {
    return (
      <a href={destination} target="_blank" rel="noopener noreferrer" ref={ref} {...rest}>
        {children}
      </a>
    );
  }

  // If a custom component is passed, render it
  if (component) {
      const Component = component;
      return <Component to={destination} ref={ref} {...rest}>{children}</Component>;
  }

  return (
    <ReactRouterLink to={destination} ref={ref as any} {...(rest as any)}>
      {children}
    </ReactRouterLink>
  );
});

LinkAdapter.displayName = 'LinkAdapter';
