import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useExtraction } from '../hooks/useExtraction';
import { QuestionInputField } from '../components/QuestionInputField';
import { ConfidenceScoreBadge } from '../components/ConfidenceScoreBadge';
import { DiffTextDisplay } from '../components/DiffTextDisplay';
import { TouchTargetButton } from '../components/TouchTargetButton';

export function ExtractionReview(): JSX.Element {
  const { communicationId } = useParams<{ communicationId: string }>();
  const navigate = useNavigate();
  const { extractions, loading, error, confirmExtractions, rejectAll } = useExtraction(communicationId || '');
  
  const [extractionStates, setExtractionStates] = useState<{ [key: string]: { accepted: boolean; editedValue: string } }>({});

  useEffect(() => {
    if (extractions && extractions.length > 0) {
      const initialStates: { [key: string]: { accepted: boolean; editedValue: string } } = {};
      extractions.forEach(extraction => {
        initialStates[extraction.id] = {
          accepted: false,
          editedValue: extraction.extractedValue
        };
      });
      setExtractionStates(initialStates);
    }
  }, [extractions]);

  const handleConfirmExtractions = async (): Promise<void> => {
    try {
      const acceptedExtractionIds = Object.keys(extractionStates).filter(
        id => extractionStates[id].accepted === true
      );
      
      if (acceptedExtractionIds.length === 0) {
        alert('Please select at least one extraction to confirm');
        return;
      }

      await confirmExtractions(acceptedExtractionIds);
      navigate(`/projects/${extractions?.[0]?.projectId}`);
    } catch (err: any) {
      alert('Failed to confirm extractions: ' + err.message);
    }
  };

  const handleRejectAll = async (): Promise<void> => {
    try {
      const confirmed = window.confirm('Are you sure you want to reject all extractions from this communication?');
      if (!confirmed) {
        return;
      }

      await rejectAll(communicationId || '');
      navigate(`/projects/${extractions?.[0]?.projectId}`);
    } catch (err: any) {
      alert('Failed to reject extractions: ' + err.message);
    }
  };

  if (loading) {
    return <div>Loading extractions...</div>;
  }

  if (error) {
    return (
      <div>
        <div>Failed to load extractions. Please try again.</div>
        <TouchTargetButton
          variant="primary"
          onClick={() => window.location.reload()}
        >
          Retry
        </TouchTargetButton>
      </div>
    );
  }

  if (!extractions || extractions.length === 0) {
    return <div>No extractions found</div>;
  }

  return (
    <div>
      <div>
        <h1>{extractions[0].communicationSubject}</h1>
        <p>{new Date(extractions[0].communicationDate).toLocaleDateString()}</p>
      </div>

      {extractions.map(extraction => (
        <div key={extraction.id}>
          <QuestionInputField
            label={extraction.fieldName}
            value={extractionStates[extraction.id]?.editedValue || extraction.extractedValue}
            onChange={(value) => {
              setExtractionStates(prev => ({
                ...prev,
                [extraction.id]: {
                  ...prev[extraction.id],
                  editedValue: value
                }
              }));
            }}
          />
          <ConfidenceScoreBadge score={extraction.confidenceScore} />
          {extraction.existingValue && (
            <DiffTextDisplay
              oldValue={extraction.existingValue}
              newValue={extraction.extractedValue}
            />
          )}
          <input
            type="checkbox"
            checked={extractionStates[extraction.id]?.accepted || false}
            onChange={(e) => {
              setExtractionStates(prev => ({
                ...prev,
                [extraction.id]: {
                  ...prev[extraction.id],
                  accepted: e.target.checked
                }
              }));
            }}
          />
        </div>
      ))}

      <div>
        <TouchTargetButton
          variant="primary"
          onClick={handleConfirmExtractions}
        >
          Confirm Selected
        </TouchTargetButton>
        <TouchTargetButton
          variant="danger"
          onClick={handleRejectAll}
        >
          Reject All
        </TouchTargetButton>
      </div>
    </div>
  );
}