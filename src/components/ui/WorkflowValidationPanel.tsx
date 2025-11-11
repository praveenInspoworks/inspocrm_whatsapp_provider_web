import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Info, 
  ChevronDown, 
  ChevronRight,
  Shield,
  Clock,
  User,
  FileText
} from 'lucide-react';
import { 
  WorkflowValidationResult, 
  WorkflowError, 
  WorkflowErrorType 
} from '@/services/enhancedWorkflowService';

interface WorkflowValidationPanelProps {
  validationResult: WorkflowValidationResult;
  workflowId?: number;
  onFixError?: (error: WorkflowError) => void;
  onAcknowledgeWarning?: (warning: string) => void;
  className?: string;
}

const WorkflowValidationPanel: React.FC<WorkflowValidationPanelProps> = ({
  validationResult,
  workflowId,
  onFixError,
  onAcknowledgeWarning,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [acknowledgedWarnings, setAcknowledgedWarnings] = useState<Set<string>>(new Set());

  const { isValid, errors, warnings, prerequisites } = validationResult;

  const getErrorIcon = (errorType: WorkflowErrorType) => {
    switch (errorType) {
      case WorkflowErrorType.INVALID_TRANSITION:
        return <XCircle className="h-4 w-4 text-red-600" />;
      case WorkflowErrorType.MISSING_PREREQUISITES:
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case WorkflowErrorType.DATA_INCONSISTENCY:
        return <XCircle className="h-4 w-4 text-red-600" />;
      case WorkflowErrorType.PERMISSION_DENIED:
        return <Shield className="h-4 w-4 text-red-600" />;
      case WorkflowErrorType.SYSTEM_ERROR:
        return <XCircle className="h-4 w-4 text-red-600" />;
      case WorkflowErrorType.VALIDATION_ERROR:
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  const getErrorBadgeVariant = (errorType: WorkflowErrorType) => {
    switch (errorType) {
      case WorkflowErrorType.INVALID_TRANSITION:
      case WorkflowErrorType.DATA_INCONSISTENCY:
      case WorkflowErrorType.PERMISSION_DENIED:
      case WorkflowErrorType.SYSTEM_ERROR:
        return 'destructive';
      case WorkflowErrorType.MISSING_PREREQUISITES:
        return 'secondary';
      case WorkflowErrorType.VALIDATION_ERROR:
        return 'outline';
      default:
        return 'outline';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const handleAcknowledgeWarning = (warning: string) => {
    setAcknowledgedWarnings(prev => new Set([...prev, warning]));
    if (onAcknowledgeWarning) {
      onAcknowledgeWarning(warning);
    }
  };

  const activeWarnings = warnings.filter(warning => !acknowledgedWarnings.has(warning));

  if (isValid && activeWarnings.length === 0 && prerequisites.length === 0) {
    return (
      <Card className={`border-green-200 bg-green-50 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Workflow validation passed</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-orange-200 ${className}`}>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {!isValid ? (
                  <XCircle className="h-5 w-5 text-red-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                )}
                <div>
                  <CardTitle className="text-lg">
                    Workflow Validation
                    {!isValid && (
                      <Badge variant="destructive" className="ml-2">
                        {errors.length} Error{errors.length !== 1 ? 's' : ''}
                      </Badge>
                    )}
                    {activeWarnings.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {activeWarnings.length} Warning{activeWarnings.length !== 1 ? 's' : ''}
                      </Badge>
                    )}
                    {prerequisites.length > 0 && (
                      <Badge variant="outline" className="ml-2">
                        {prerequisites.length} Prerequisite{prerequisites.length !== 1 ? 's' : ''}
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {!isValid 
                      ? 'Workflow has validation errors that need to be resolved'
                      : 'Workflow has warnings and prerequisites to review'
                    }
                  </CardDescription>
                </div>
              </div>
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <ScrollArea className="max-h-96">
              <div className="space-y-4">
                {/* Errors */}
                {errors.length > 0 && (
                  <div>
                    <h4 className="font-medium text-red-700 mb-2 flex items-center gap-2">
                      <XCircle className="h-4 w-4" />
                      Errors ({errors.length})
                    </h4>
                    <div className="space-y-2">
                      {errors.map((error, index) => (
                        <Alert key={index} variant="destructive">
                          <div className="flex items-start gap-3">
                            {getErrorIcon(error.type)}
                            <div className="flex-1">
                              <AlertDescription className="font-medium">
                                {error.message}
                              </AlertDescription>
                              {error.details && (
                                <div className="mt-1 text-sm opacity-90">
                                  <pre className="whitespace-pre-wrap text-xs">
                                    {JSON.stringify(error.details, null, 2)}
                                  </pre>
                                </div>
                              )}
                              <div className="flex items-center gap-4 mt-2 text-xs opacity-75">
                                {error.workflowId && (
                                  <span className="flex items-center gap-1">
                                    <FileText className="h-3 w-3" />
                                    WF-{error.workflowId}
                                  </span>
                                )}
                                {error.stepNumber && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    Step {error.stepNumber}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatTimestamp(error.timestamp)}
                                </span>
                              </div>
                            </div>
                            <Badge variant={getErrorBadgeVariant(error.type)}>
                              {error.type.replace('_', ' ')}
                            </Badge>
                          </div>
                          {onFixError && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2"
                              onClick={() => onFixError(error)}
                            >
                              Fix Error
                            </Button>
                          )}
                        </Alert>
                      ))}
                    </div>
                  </div>
                )}

                {/* Warnings */}
                {activeWarnings.length > 0 && (
                  <div>
                    <h4 className="font-medium text-orange-700 mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Warnings ({activeWarnings.length})
                    </h4>
                    <div className="space-y-2">
                      {activeWarnings.map((warning, index) => (
                        <Alert key={index} variant="default" className="border-orange-200 bg-orange-50">
                          <AlertTriangle className="h-4 w-4 text-orange-600" />
                          <AlertDescription className="text-orange-800">
                            {warning}
                          </AlertDescription>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => handleAcknowledgeWarning(warning)}
                          >
                            Acknowledge
                          </Button>
                        </Alert>
                      ))}
                    </div>
                  </div>
                )}

                {/* Prerequisites */}
                {prerequisites.length > 0 && (
                  <div>
                    <h4 className="font-medium text-blue-700 mb-2 flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      Prerequisites ({prerequisites.length})
                    </h4>
                    <div className="space-y-2">
                      {prerequisites.map((prerequisite, index) => (
                        <Alert key={index} variant="default" className="border-blue-200 bg-blue-50">
                          <Info className="h-4 w-4 text-blue-600" />
                          <AlertDescription className="text-blue-800">
                            {prerequisite}
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </div>
                )}

                {/* Summary */}
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>
                      {!isValid 
                        ? 'Please resolve all errors before proceeding'
                        : 'Review warnings and prerequisites as needed'
                      }
                    </span>
                    {workflowId && (
                      <span>Workflow ID: {workflowId}</span>
                    )}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default WorkflowValidationPanel;
