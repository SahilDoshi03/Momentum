import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Dropdown, DropdownItem, DropdownDivider, DropdownHeader } from '@/components/ui/Dropdown';
import '@testing-library/jest-dom';

describe('Dropdown', () => {
    it('toggles open/close on trigger click', () => {
        render(
            <Dropdown trigger={<button>Trigger</button>}>
                <DropdownItem>Item 1</DropdownItem>
            </Dropdown>
        );

        expect(screen.queryByText('Item 1')).not.toBeInTheDocument();

        fireEvent.click(screen.getByText('Trigger'));
        expect(screen.getByText('Item 1')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Trigger'));
        expect(screen.queryByText('Item 1')).not.toBeInTheDocument();
    });

    it('closes on outside click', () => {
        render(
            <div>
                <div data-testid="outside">Outside</div>
                <Dropdown trigger={<button>Trigger</button>}>
                    <DropdownItem>Item 1</DropdownItem>
                </Dropdown>
            </div>
        );

        fireEvent.click(screen.getByText('Trigger'));
        expect(screen.getByText('Item 1')).toBeInTheDocument();

        fireEvent.mouseDown(screen.getByTestId('outside'));
        expect(screen.queryByText('Item 1')).not.toBeInTheDocument();
    });

    it('handles item clicks', () => {
        const handleClick = jest.fn();
        render(
            <Dropdown trigger={<button>Trigger</button>}>
                <DropdownItem onClick={handleClick}>Item 1</DropdownItem>
            </Dropdown>
        );

        fireEvent.click(screen.getByText('Trigger'));
        fireEvent.click(screen.getByText('Item 1'));
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('renders divider and header', () => {
        render(
            <Dropdown trigger={<button>Trigger</button>}>
                <DropdownHeader>Header</DropdownHeader>
                <DropdownDivider />
                <DropdownItem>Item 1</DropdownItem>
            </Dropdown>
        );

        fireEvent.click(screen.getByText('Trigger'));
        expect(screen.getByText('Header')).toBeInTheDocument();
        expect(screen.getByText('Item 1')).toBeInTheDocument();
    });

    it('applies align classes', () => {
        const { container } = render(
            <Dropdown trigger={<button>Trigger</button>} align="right">
                <DropdownItem>Item 1</DropdownItem>
            </Dropdown>
        );

        fireEvent.click(screen.getByText('Trigger'));
        // The dropdown menu should have 'right-0' class
        const menu = container.querySelector('.right-0');
        expect(menu).toBeInTheDocument();
    });
});
