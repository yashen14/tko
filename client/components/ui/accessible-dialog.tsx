import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, VisuallyHidden } from "./dialog";

interface AccessibleDialogContentProps extends React.ComponentProps<typeof DialogContent> {
  /**
   * Accessibility title for screen readers.
   * If not provided, will use a hidden default title.
   */
  accessibilityTitle?: string;
  /**
   * Whether to hide the title visually while keeping it accessible.
   */
  hideTitle?: boolean;
}

/**
 * AccessibleDialogContent ensures every dialog has a proper title for accessibility.
 * This wrapper automatically adds a DialogTitle if one is not detected.
 */
export const AccessibleDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogContent>,
  AccessibleDialogContentProps
>(({ children, accessibilityTitle = "Dialog", hideTitle = false, ...props }, ref) => {
  // Check if children already contain DialogTitle
  const hasDialogTitle = React.useMemo(() => {
    let foundTitle = false;
    
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child)) {
        // Check if this is a DialogHeader with DialogTitle
        if (child.type === DialogHeader) {
          React.Children.forEach(child.props.children, (headerChild) => {
            if (React.isValidElement(headerChild)) {
              if (headerChild.type === DialogTitle) {
                foundTitle = true;
              }
              // Check for VisuallyHidden DialogTitle
              if (headerChild.type === VisuallyHidden) {
                React.Children.forEach(headerChild.props.children, (hiddenChild) => {
                  if (React.isValidElement(hiddenChild) && hiddenChild.type === DialogTitle) {
                    foundTitle = true;
                  }
                });
              }
            }
          });
        }
      }
    });
    
    return foundTitle;
  }, [children]);

  return (
    <DialogContent ref={ref} {...props}>
      {!hasDialogTitle && (
        <DialogHeader>
          <VisuallyHidden>
            <DialogTitle>{accessibilityTitle}</DialogTitle>
          </VisuallyHidden>
        </DialogHeader>
      )}
      {children}
    </DialogContent>
  );
});

AccessibleDialogContent.displayName = "AccessibleDialogContent";

// Re-export all dialog components for convenience
export {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  VisuallyHidden,
} from "./dialog";
