import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useExtraction } from '../hooks/useExtraction'
import { QuestionInputField } from '../components/QuestionInputField'
import { TouchTargetButton } from '../components/TouchTargetButton'

export function CommunicationUpload(): JSX.Element {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [sourceType, setSourceType] = useState<'text' | 'file'>('text')
  const [textContent, setTextContent] = useState<string>('')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string>('')
  
  const { triggerExtraction } = useExtraction()

  const handleExtract = async () => {
    setIsProcessing(true)
    setErrorMessage('')
    
    try {
      if (sourceType === 'text') {
        await triggerExtraction({ 
          projectId: projectId!, 
          sourceType: 'text', 
          content: textContent 
        })
      } else if (sourceType === 'file') {
        await triggerExtraction({ 
          projectId: projectId!, 
          sourceType: 'file', 
          file: uploadedFile! 
        })
      }
      
      navigate(`/projects/${projectId}/extractions`)
    } catch (error: any) {
      setIsProcessing(false)
      setErrorMessage(error.message)
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      setUploadedFile(files[0])
    }
  }

  const isDisabled = isProcessing || 
    (sourceType === 'text' && textContent.length === 0) || 
    (sourceType === 'file' && uploadedFile === null)

  return (
    <div>
      <h1>Upload Communication</h1>
      
      <div>
        <label>
          <input
            type="radio"
            name="sourceType"
            value="text"
            checked={sourceType === 'text'}
            onChange={() => setSourceType('text')}
            disabled={isProcessing}
          />
          Paste Text
        </label>
        
        <label>
          <input
            type="radio"
            name="sourceType"
            value="file"
            checked={sourceType === 'file'}
            onChange={() => setSourceType('file')}
            disabled={isProcessing}
          />
          Upload File
        </label>
      </div>

      {sourceType === 'text' && (
        <QuestionInputField
          label="Email/SMS Content"
          inputType="textarea"
          value={textContent}
          onChange={setTextContent}
          validationState={textContent.length > 0 ? 'valid' : 'empty'}
          disabled={isProcessing}
        />
      )}

      {sourceType === 'file' && (
        <input
          type="file"
          accept=".txt,.eml,.msg"
          onChange={handleFileChange}
          disabled={isProcessing}
        />
      )}

      <TouchTargetButton
        variant="primary"
        label="Extract Information"
        onClick={handleExtract}
        disabled={isDisabled}
        loading={isProcessing}
      />

      {errorMessage && (
        <div className="error-message" style={{ color: 'red' }}>
          {errorMessage}
        </div>
      )}
    </div>
  )
}