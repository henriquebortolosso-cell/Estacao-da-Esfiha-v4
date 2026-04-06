## Packages
lucide-react | Essential icons for UI
react-hook-form | Form state management
@hookform/resolvers | Form validation with Zod
zod | Schema validation
clsx | Utility for constructing className strings conditionally
tailwind-merge | Utility to merge tailwind classes without style conflicts
@radix-ui/react-dialog | Accessible dialog/modal primitives for cart
@radix-ui/react-radio-group | Accessible radio buttons for payment methods
@radix-ui/react-slot | Slot primitive for accessible components
@radix-ui/react-label | Accessible label primitive

## Notes
- Using React Context for cart state management (no external store needed).
- API endpoints are assumed to be available at /api/* as per shared/routes.ts.
- Decimals (prices) are handled as strings in the API payload to match standard Drizzle decimal behavior.
