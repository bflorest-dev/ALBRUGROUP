import { render } from '@testing-library/react';
import { Spinner } from './Spinner';

describe('Spinner atom', () => {
  it('renders with default size and color', () => {
    const { getByLabelText } = render(<Spinner />);
    const element = getByLabelText('Loading');
    expect(element).toBeInTheDocument();
    expect(element).toHaveStyle({ width: '24px', height: '24px' });
  });

  it('accepts custom size and color', () => {
    const { getByLabelText } = render(<Spinner size={32} color="red" />);
    const element = getByLabelText('Loading');
    expect(element).toHaveStyle({ width: '32px', height: '32px', borderColor: 'red' });
  });
});
