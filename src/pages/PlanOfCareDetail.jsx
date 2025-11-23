import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { planOfCareAPI } from '../services/planOfCareAPI';
import { toast } from 'react-toastify';
import { 
  Edit, ArrowLeft, Check, X, Calendar, User, FileText, 
  Activity, Target, ClipboardList, Stethoscope
} from 'lucide-react';
import './PlanOfCareDetail.css';

const PlanOfCareDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [poc, setPoc] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPOC();
  }, [id]);

  const loadPOC = async () => {
    try {
      setLoading(true);
      const data = await planOfCareAPI.getById(id);
      setPoc(data);
    } catch (error) {
      console.error('Error loading Plan of Care:', error);
      toast.error('Failed to load Plan of Care');
      navigate('/plan-of-care');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (window.confirm('Are you sure you want to approve this Plan of Care?')) {
      try {
        await planOfCareAPI.approve(id);
        toast.success('Plan of Care approved successfully');
        loadPOC();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to approve Plan of Care');
      }
    }
  };

  const handleReject = async () => {
    const reason = window.prompt('Please provide a reason for rejection:');
    if (reason) {
      try {
        await planOfCareAPI.reject(id, reason);
        toast.success('Plan of Care rejected');
        loadPOC();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to reject Plan of Care');
      }
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      DRAFT: { className: 'status-draft', label: 'Draft' },
      PENDING_APPROVAL: { className: 'status-pending', label: 'Pending Approval' },
      APPROVED: { className: 'status-approved', label: 'Approved' },
      REJECTED: { className: 'status-rejected', label: 'Rejected' },
      ACTIVE: { className: 'status-active', label: 'Active' },
      COMPLETED: { className: 'status-completed', label: 'Completed' }
    };
    const config = statusConfig[status] || { className: '', label: status };
    return <span className={`status-badge ${config.className}`}>{config.label}</span>;
  };

  if (loading) {
    return (
      <div className="poc-detail-container">
        <div className="loading">Loading Plan of Care...</div>
      </div>
    );
  }

  if (!poc) {
    return (
      <div className="poc-detail-container">
        <div className="error">Plan of Care not found</div>
      </div>
    );
  }

  return (
    <div className="poc-detail-container">
      <div className="detail-header">
        <div className="header-left">
          <button className="btn-back" onClick={() => navigate('/plan-of-care')}>
            <ArrowLeft size={20} />
            Back
          </button>
          <div>
            <h1>Plan of Care: {poc.pocNumber}</h1>
            <div className="header-meta">
              <span>{getStatusBadge(poc.status)}</span>
              {poc.patientName && <span><User size={16} /> {poc.patientName}</span>}
            </div>
          </div>
        </div>
        <div className="header-actions">
          {(poc.status === 'DRAFT' || poc.status === 'REJECTED') && (
            <button className="btn btn-primary" onClick={() => navigate(`/plan-of-care/edit/${id}`)}>
              <Edit size={18} />
              Edit
            </button>
          )}
          {poc.status === 'PENDING_APPROVAL' && (
            <>
              <button className="btn btn-success" onClick={handleApprove}>
                <Check size={18} />
                Approve
              </button>
              <button className="btn btn-danger" onClick={handleReject}>
                <X size={18} />
                Reject
              </button>
            </>
          )}
        </div>
      </div>

      <div className="detail-content">
        {/* Basic Information */}
        <div className="detail-section">
          <h2><FileText size={20} /> Basic Information</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>Patient</label>
              <div>{poc.patientName || 'N/A'}</div>
            </div>
            <div className="info-item">
              <label>Episode</label>
              <div>{poc.episodeNumber || 'N/A'}</div>
            </div>
            <div className="info-item">
              <label>Start Date</label>
              <div>{poc.startDate ? new Date(poc.startDate).toLocaleDateString() : 'N/A'}</div>
            </div>
            <div className="info-item">
              <label>End Date</label>
              <div>{poc.endDate ? new Date(poc.endDate).toLocaleDateString() : 'N/A'}</div>
            </div>
            <div className="info-item">
              <label>Certification Period</label>
              <div>{poc.certificationPeriodDays || 60} days</div>
            </div>
            <div className="info-item">
              <label>Status</label>
              <div>{getStatusBadge(poc.status)}</div>
            </div>
          </div>
        </div>

        {/* Diagnosis Information */}
        <div className="detail-section">
          <h2><Stethoscope size={20} /> Diagnosis Information</h2>
          <div className="info-grid">
            <div className="info-item full-width">
              <label>Primary Diagnosis</label>
              <div>
                {poc.primaryDiagnosisCode && (
                  <span className="diagnosis-code">{poc.primaryDiagnosisCode}</span>
                )}
                {poc.primaryDiagnosisDescription && (
                  <span className="diagnosis-desc">{poc.primaryDiagnosisDescription}</span>
                )}
              </div>
            </div>
            {poc.secondaryDiagnosisCode && (
              <div className="info-item full-width">
                <label>Secondary Diagnosis</label>
                <div>
                  <span className="diagnosis-code">{poc.secondaryDiagnosisCode}</span>
                  {poc.secondaryDiagnosisDescription && (
                    <span className="diagnosis-desc">{poc.secondaryDiagnosisDescription}</span>
                  )}
                </div>
              </div>
            )}
            {poc.otherDiagnoses && (
              <div className="info-item full-width">
                <label>Other Diagnoses</label>
                <div>{poc.otherDiagnoses}</div>
              </div>
            )}
          </div>
        </div>

        {/* Visit Frequencies */}
        {poc.frequencies && poc.frequencies.length > 0 && (
          <div className="detail-section">
            <h2><Activity size={20} /> Visit Frequencies</h2>
            <div className="table-container">
              <table className="detail-table">
                <thead>
                  <tr>
                    <th>Discipline</th>
                    <th>Frequency Code</th>
                    <th>Visits/Week</th>
                    <th>Weeks</th>
                    <th>Total Visits</th>
                    <th>Completed</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {poc.frequencies.map((freq, idx) => (
                    <tr key={idx}>
                      <td>{freq.disciplineType} {freq.disciplineDescription && `(${freq.disciplineDescription})`}</td>
                      <td>{freq.frequencyCode || 'N/A'}</td>
                      <td>{freq.visitsPerWeek || 'N/A'}</td>
                      <td>{freq.numberOfWeeks || 'N/A'}</td>
                      <td>{freq.totalVisits || 'N/A'}</td>
                      <td>{freq.completedVisits || 0}</td>
                      <td>
                        <span className={`status-badge status-${freq.status?.toLowerCase() || 'default'}`}>
                          {freq.status || 'N/A'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Interventions */}
        {poc.interventions && poc.interventions.length > 0 && (
          <div className="detail-section">
            <h2><ClipboardList size={20} /> Interventions</h2>
            <div className="interventions-list">
              {poc.interventions.map((intervention, idx) => (
                <div key={idx} className="intervention-card">
                  <div className="intervention-header">
                    <h4>{intervention.interventionCategory || 'Intervention'}</h4>
                    <span className={`status-badge status-${intervention.status?.toLowerCase() || 'default'}`}>
                      {intervention.status || 'ACTIVE'}
                    </span>
                  </div>
                  <p>{intervention.interventionDescription}</p>
                  <div className="intervention-meta">
                    {intervention.responsibleDiscipline && (
                      <span>Discipline: {intervention.responsibleDiscipline}</span>
                    )}
                    {intervention.frequency && <span>Frequency: {intervention.frequency}</span>}
                    {intervention.duration && <span>Duration: {intervention.duration}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Goals */}
        {poc.goals && poc.goals.length > 0 && (
          <div className="detail-section">
            <h2><Target size={20} /> Goals</h2>
            <div className="goals-list">
              {poc.goals.map((goal, idx) => (
                <div key={idx} className="goal-card">
                  <div className="goal-header">
                    <h4>{goal.goalCategory || 'Goal'}</h4>
                    <span className={`status-badge status-${goal.status?.toLowerCase() || 'default'}`}>
                      {goal.status || 'ACTIVE'}
                    </span>
                  </div>
                  <p><strong>Description:</strong> {goal.goalDescription}</p>
                  {goal.measurableOutcome && (
                    <p><strong>Measurable Outcome:</strong> {goal.measurableOutcome}</p>
                  )}
                  <div className="goal-meta">
                    {goal.baselineMeasure && <span>Baseline: {goal.baselineMeasure}</span>}
                    {goal.targetMeasure && <span>Target: {goal.targetMeasure}</span>}
                    {goal.targetDate && (
                      <span>Target Date: {new Date(goal.targetDate).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Physician Orders */}
        {poc.physicianOrders && poc.physicianOrders.length > 0 && (
          <div className="detail-section">
            <h2><Stethoscope size={20} /> Physician Orders</h2>
            <div className="table-container">
              <table className="detail-table">
                <thead>
                  <tr>
                    <th>Order Number</th>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Discipline</th>
                    <th>Frequency</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {poc.physicianOrders.map((order, idx) => (
                    <tr key={idx}>
                      <td>{order.orderNumber || 'N/A'}</td>
                      <td>{order.orderType || 'N/A'}</td>
                      <td>{order.orderDescription}</td>
                      <td>{order.discipline || 'N/A'}</td>
                      <td>{order.frequency || 'N/A'}</td>
                      <td>
                        <span className={`status-badge status-${order.status?.toLowerCase() || 'default'}`}>
                          {order.status || 'N/A'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Clinical Information */}
        {(poc.functionalLimitations || poc.safetyMeasures || poc.medicationList) && (
          <div className="detail-section">
            <h2><FileText size={20} /> Clinical Information</h2>
            <div className="info-grid">
              {poc.functionalLimitations && (
                <div className="info-item full-width">
                  <label>Functional Limitations</label>
                  <div>{poc.functionalLimitations}</div>
                </div>
              )}
              {poc.safetyMeasures && (
                <div className="info-item full-width">
                  <label>Safety Measures</label>
                  <div>{poc.safetyMeasures}</div>
                </div>
              )}
              {poc.medicationList && (
                <div className="info-item full-width">
                  <label>Medication List</label>
                  <div>{poc.medicationList}</div>
                </div>
              )}
              {poc.nutritionalRequirements && (
                <div className="info-item full-width">
                  <label>Nutritional Requirements</label>
                  <div>{poc.nutritionalRequirements}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Physician Information */}
        {poc.physicianName && (
          <div className="detail-section">
            <h2><User size={20} /> Physician Information</h2>
            <div className="info-grid">
              <div className="info-item">
                <label>Physician Name</label>
                <div>{poc.physicianName}</div>
              </div>
              {poc.physicianPhone && (
                <div className="info-item">
                  <label>Phone</label>
                  <div>{poc.physicianPhone}</div>
                </div>
              )}
              {poc.physicianSignatureObtained && (
                <div className="info-item">
                  <label>Signature Obtained</label>
                  <div>{poc.physicianSignatureObtained ? 'Yes' : 'No'}</div>
                </div>
              )}
              {poc.physicianSignedDate && (
                <div className="info-item">
                  <label>Signed Date</label>
                  <div>{new Date(poc.physicianSignedDate).toLocaleDateString()}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Additional Information */}
        {(poc.specialInstructions || poc.dmeEquipment || poc.notes) && (
          <div className="detail-section">
            <h2><FileText size={20} /> Additional Information</h2>
            <div className="info-grid">
              {poc.specialInstructions && (
                <div className="info-item full-width">
                  <label>Special Instructions</label>
                  <div>{poc.specialInstructions}</div>
                </div>
              )}
              {poc.dmeEquipment && (
                <div className="info-item full-width">
                  <label>DME Equipment</label>
                  <div>{poc.dmeEquipment}</div>
                </div>
              )}
              {poc.notes && (
                <div className="info-item full-width">
                  <label>Notes</label>
                  <div>{poc.notes}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Workflow Information */}
        <div className="detail-section">
          <h2><Calendar size={20} /> Workflow Information</h2>
          <div className="info-grid">
            {poc.createdByClinicianName && (
              <div className="info-item">
                <label>Created By</label>
                <div>{poc.createdByClinicianName}</div>
              </div>
            )}
            {poc.approvedByName && (
              <div className="info-item">
                <label>Approved By</label>
                <div>{poc.approvedByName}</div>
              </div>
            )}
            {poc.approvedAt && (
              <div className="info-item">
                <label>Approved At</label>
                <div>{new Date(poc.approvedAt).toLocaleString()}</div>
              </div>
            )}
            {poc.rejectedByName && (
              <div className="info-item">
                <label>Rejected By</label>
                <div>{poc.rejectedByName}</div>
              </div>
            )}
            {poc.rejectionReason && (
              <div className="info-item full-width">
                <label>Rejection Reason</label>
                <div>{poc.rejectionReason}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanOfCareDetail;

