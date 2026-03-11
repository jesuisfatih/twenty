import { useState } from 'react';

import {
  ASSIGNABLE_ROLES,
  type CompanyRoleName,
  ROLE_LABELS,
} from '@/auth/types/companyMembership';
import { styled } from '@linaria/react';

const StyledOverlay = styled.div`
  align-items: center;
  background-color: rgba(0, 0, 0, 0.4);
  display: flex;
  inset: 0;
  justify-content: center;
  position: fixed;
  z-index: 1000;
`;

const StyledModal = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
  max-width: 420px;
  padding: 24px;
  width: 100%;
`;

const StyledTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 16px;
`;

const StyledField = styled.div`
  margin-bottom: 12px;
`;

const StyledLabel = styled.label`
  display: block;
  font-size: 12px;
  font-weight: 500;
  margin-bottom: 4px;
`;

const StyledInput = styled.input`
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 13px;
  padding: 8px 10px;
  width: 100%;

  &:focus {
    border-color: #3498db;
    outline: none;
  }
`;

const StyledSelect = styled.select`
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 13px;
  padding: 8px 10px;
  width: 100%;
`;

const StyledButtonRow = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 16px;
`;

const StyledButton = styled.button<{ variant?: 'primary' | 'secondary' }>`
  background-color: ${({ variant }) =>
    variant === 'primary' ? '#3498db' : '#f0f0f0'};
  border: none;
  border-radius: 4px;
  color: ${({ variant }) => (variant === 'primary' ? 'white' : '#333')};
  cursor: pointer;
  font-size: 13px;
  padding: 8px 16px;

  &:hover {
    opacity: 0.85;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

const StyledError = styled.div`
  color: #e74c3c;
  font-size: 12px;
  margin-top: 8px;
`;

type InviteMemberModalProps = {
  onInvite: (userId: string, role: CompanyRoleName) => Promise<void>;
  onClose: () => void;
};

export const InviteMemberModal = ({
  onInvite,
  onClose,
}: InviteMemberModalProps) => {
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState<CompanyRoleName>('COMPANY_READONLY');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!userId.trim()) {
      setError('User ID is required');

      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onInvite(userId.trim(), role);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to invite member',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <StyledOverlay onClick={onClose}>
      <StyledModal onClick={(e) => e.stopPropagation()}>
        <StyledTitle>Invite Team Member</StyledTitle>
        <StyledField>
          <StyledLabel>User ID</StyledLabel>
          <StyledInput
            type="text"
            placeholder="Enter user UUID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
        </StyledField>
        <StyledField>
          <StyledLabel>Role</StyledLabel>
          <StyledSelect
            value={role}
            onChange={(e) => setRole(e.target.value as CompanyRoleName)}
          >
            {ASSIGNABLE_ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </StyledSelect>
        </StyledField>
        {error && <StyledError>{error}</StyledError>}
        <StyledButtonRow>
          <StyledButton variant="secondary" onClick={onClose}>
            Cancel
          </StyledButton>
          <StyledButton
            variant="primary"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Inviting…' : 'Invite'}
          </StyledButton>
        </StyledButtonRow>
      </StyledModal>
    </StyledOverlay>
  );
};
