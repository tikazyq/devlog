# CSS Architecture

This directory contains modular CSS files that are imported into the main `globals.css` file.

## Structure

```
styles/
├── base.css           # Base styles, CSS resets, and typography
├── antd-overrides.css # Ant Design component customizations
├── layout.css         # App layout, navigation, and component styles
└── responsive.css     # Responsive design and mobile styles
```

## Import Order

The CSS files are imported in a specific order to maintain the cascade:

1. **Tailwind CSS** - Base framework
2. **Third-party styles** - External libraries (highlight.js)
3. **Base styles** - Custom base styles and typography
4. **Ant Design overrides** - Framework component customizations
5. **Layout styles** - App structure, navigation, and component styles
6. **Responsive styles** - Media queries and mobile overrides

## Guidelines

### Adding New Styles

- **Base styles**: Global typography, colors, and resets go in `base.css`
- **Component styles**: Specific component styles go in `components.css`
- **Layout styles**: App structure and navigation go in `layout.css`
- **Responsive styles**: Media queries go in `responsive.css`
- **Ant Design**: Component overrides go in `antd-overrides.css`

### Naming Conventions

- Use BEM-like naming: `.component-name`, `.component-name__element`, `.component-name--modifier`
- Prefix component-specific classes with the component name (e.g., `.dashboard-container`, `.devlog-item`)
- Use semantic names that describe purpose, not appearance

### Best Practices

- Keep specificity low
- Avoid `!important` unless absolutely necessary
- Group related styles together
- Add comments for complex or non-obvious styles
- Test responsive behavior across breakpoints

## Migration Notes

This modular structure was created from a large `globals.css` file to improve maintainability and reduce risk when making changes. All styles have been preserved and organized by concern.
