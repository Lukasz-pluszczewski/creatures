import React, { useCallback, useState } from 'react';
import { FormControl, Dropdown } from 'react-bootstrap';

const CustomMenu = React.forwardRef(
  ({ children, style, className, 'aria-labelledby': labeledBy }, ref) => {
    const [value, setValue] = useState('');

    return (
      <div
        ref={ref}
        style={style}
        className={className}
        aria-labelledby={labeledBy}
      >
        <FormControl
          autoFocus
          className="mx-3 my-2 w-auto"
          placeholder="Type to filter..."
          onChange={(e) => setValue(e.target.value)}
          value={value}
        />
        <ul className="list-unstyled">
          {React.Children.toArray(children).filter(
            (child) =>
              !value || child.props.children.toLowerCase().startsWith(value),
          )}
        </ul>
      </div>
    );
  },
);

// const CustomToggle = React.forwardRef(({ children, onClick }, ref) => (
//   <a
//     href=""
//     ref={ref}
//     onClick={(e) => {
//       e.preventDefault();
//       onClick(e);
//     }}
//   >
//     {children}
//     &#x25bc;
//   </a>
// ));

export const CustomItem = ({ value, optionValue, optionLabel, onChange }) => {
  const handleClick = useCallback(
    () => onChange(optionValue),
    [onChange, optionValue]
  );
  return (
    <Dropdown.Item
      key={optionValue}
      eventKey={optionValue}
      value={optionValue}
      onClick={handleClick}
      active={optionValue === value}
    >
      {optionLabel}
    </Dropdown.Item>
  );
};

export const CustomDropdown = ({ label, options, value, onChange }) => {
  return (
    <Dropdown>
      <Dropdown.Toggle>{label}</Dropdown.Toggle>
      <Dropdown.Menu as={CustomMenu}>
        {options.map(({ label: optionLabel, value: optionValue }) => (
          <CustomItem value={value} optionValue={optionValue} optionLabel={optionLabel} onChange={onChange} />
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
};
