import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useProject } from '../hooks/useProject';
import { StatusBadge } from '../components/StatusBadge';
import { CollapsiblePanel } from '../components/CollapsiblePanel';
import { SectionHeader } from '../components/SectionHeader';
import { QuestionInputField } from '../components/QuestionInputField';
import { TouchTargetButton } from '../components/TouchTargetButton';
import { FloatingSaveIndicator } from '../components/FloatingSaveIndicator';
import { CompletionIndicator } from '../components/CompletionIndicator';

export function MobileProjectView(): JSX.Element {
  const { projectId } = useParams<{ projectId: string }>();
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [saveStatus, setSaveStatus] = useState<'saving' | 'saved' | 'error' | null>(null);
  const [retryCallback, setRetryCallback] = useState<(() => void) | null>(null);

  let project, loading, error, updateProject;
  try {
    const projectData = useProject(projectId!);
    project = projectData.project;
    loading = projectData.loading;
    error = projectData.error;
    updateProject = projectData.updateProject;
  } catch (err) {
    error = 'Failed to load project. Please try again.';
    loading = false;
  }

  const handleRetry = () => {
    window.location.reload();
  };

  const sections = ['Customer Info', 'Location', 'System Details', 'Installation'];

  const toggleSection = (sectionName: string): void => {
    if (expandedSections.includes(sectionName)) {
      setExpandedSections(expandedSections.filter(name => name !== sectionName));
    } else {
      setExpandedSections([...expandedSections, sectionName]);
    }
  };

  const handleFieldChange = async (fieldName: string, value: any): Promise<void> => {
    setSaveStatus('saving');
    try {
      await updateProject({ [fieldName]: value });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(null), 2000);
    } catch (err) {
      setSaveStatus('error');
      setRetryCallback(() => () => handleFieldChange(fieldName, value));
    }
  };

  if (loading) {
    return (
      <div className="mobile-project-view">
        <div className="loading-spinner">Loading project...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mobile-project-view">
        <div className="error-message">Failed to load project. Please try again.</div>
        <TouchTargetButton onClick={handleRetry}>Retry</TouchTargetButton>
      </div>
    );
  }

  return (
    <div className="mobile-project-view">
      <div className="header">
        <h1>{project?.name}</h1>
        <StatusBadge status={project?.status} />
        <TouchTargetButton onClick={() => window.open(`tel:${project?.customer_phone}`)}>
          Call Customer
        </TouchTargetButton>
      </div>

      {sections.map((sectionName) => (
        <CollapsiblePanel
          key={sectionName}
          isExpanded={expandedSections.includes(sectionName)}
          onToggle={() => toggleSection(sectionName)}
        >
          <SectionHeader title={sectionName}>
            <CompletionIndicator 
              answered={project?.sections?.[sectionName]?.answered || 0}
              total={project?.sections?.[sectionName]?.total || 0}
            />
          </SectionHeader>
          
          {expandedSections.includes(sectionName) && (
            <div className="section-content">
              {project?.sections?.[sectionName]?.questions?.map((question: any) => (
                <QuestionInputField
                  key={question.id}
                  question={question}
                  value={project[question.fieldName]}
                  onChange={(value) => handleFieldChange(question.fieldName, value)}
                  touchOptimized={true}
                />
              ))}
            </div>
          )}
        </CollapsiblePanel>
      ))}

      <FloatingSaveIndicator 
        status={saveStatus} 
        onRetry={retryCallback}
      />
    </div>
  );
}