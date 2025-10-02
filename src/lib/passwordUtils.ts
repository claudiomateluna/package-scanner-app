// src/lib/passwordUtils.ts

// Password validation function
export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Minimum length (at least 8 characters)
  if (password.length < 8) {
    errors.push('La contraseña debe tener al menos 8 caracteres');
  }
  
  // At least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra mayúscula');
  }
  
  // At least one lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra minúscula');
  }
  
  // At least one number
  if (!/\d/.test(password)) {
    errors.push('La contraseña debe contener al menos un número');
  }
  
  // At least one special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('La contraseña debe contener al menos un carácter especial (!@#$%^&*()_+-=[]{}|;\\\'":,./<>?)');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Check if password is in history (prevent reuse of recent passwords)
export function isPasswordInHistory(password: string, passwordHistory: string[] = []): boolean {
  // In a real implementation, you would hash the password and compare with stored hashes
  // For this example, we'll compare plain text (not recommended for production)
  return passwordHistory.includes(password);
}

// Function to hash password (would use a proper hashing library in production)
export function hashPassword(password: string): string {
  // Note: This is a simplified version for demonstration purposes
  // In a real application, use a proper password hashing library like bcrypt
  return btoa(password); // Base64 encoding - not secure for production
}

// Function to check if a user must change their password
export async function checkIfMustChangePassword(userId: string): Promise<boolean> {
  // This would typically be implemented in the backend, but for client-side checks
  // we would need to make an API call to verify if the user must change their password
  const response = await fetch('/api/check-password-change-requirement', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId }),
  });
  
  if (!response.ok) {
    throw new Error('Error checking password change requirement');
  }
  
  const { mustChangePassword } = await response.json();
  return mustChangePassword;
}