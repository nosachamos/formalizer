import React from 'react';

export class ErrorBoundary extends React.Component {
  componentDidCatch(error, info) {
    // we silence these errors as they are expected by several tests and handled/asserted when needed
  }

  render() {
    return this.props.children;
  }
}
