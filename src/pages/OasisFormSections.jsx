/**
 * OASIS-E1 Form Sections - Complete Implementation
 * All remaining sections (C, D, E, F, G, H, I, M, N, P, Q)
 * To be imported and used in OasisFormComplete.jsx
 */
import React from 'react';

/**
 * Section C: Living Arrangements
 */
export const renderSectionC = (formData, handleChange) => (
  <div className="oasis-section">
    <h2>Section C: Living Arrangements</h2>
    <p className="section-description">Patient's living situation and support system</p>

    <div className="form-group">
      <label>M1100 - Patient Living Situation</label>
      <p>Which of the following best describes the patient's residential circumstance and availability of assistance?</p>
      <select name="m1100LivingSituation" value={formData.m1100LivingSituation} onChange={handleChange}>
        <option value="">Select...</option>
        <option value="01">Patient lives alone</option>
        <option value="02">Patient lives with other person(s) in the home</option>
        <option value="03">Patient lives in congregate situation (e.g., assisted living)</option>
        <option value="04">Patient lives in nursing home</option>
      </select>
    </div>
  </div>
);

/**
 * Section D: Sensory Status
 */
export const renderSectionD = (formData, handleChange) => (
  <div className="oasis-section">
    <h2>Section D: Sensory Status</h2>
    <p className="section-description">Vision and hearing assessment</p>

    <div className="form-group">
      <label>M1200 - Vision (with corrective lenses if the patient usually wears them)</label>
      <select name="m1200Vision" value={formData.m1200Vision} onChange={handleChange}>
        <option value="">Select...</option>
        <option value="0">Normal vision: sees adequately in most situations; can see medication labels, newsprint</option>
        <option value="1">Partially impaired: cannot see medication labels or newsprint, but can see obstacles in path, and the surrounding layout; can count fingers at arm's length</option>
        <option value="2">Severely impaired: cannot locate objects without hearing or touching them or patient nonresponsive</option>
      </select>
    </div>

    <div className="form-group">
      <label>M1242 - Hearing and Ability to Understand Spoken Language (with hearing aids if the patient usually uses them)</label>
      <select name="m1242Hearing" value={formData.m1242Hearing} onChange={handleChange}>
        <option value="">Select...</option>
        <option value="0">No observable impairment. Able to hear and understand complex or detailed instructions and extended or abstract conversation</option>
        <option value="1">With minimal difficulty, able to hear and understand most multi-step instructions and ordinary conversation. May need occasional repetition, extra time, or louder voice</option>
        <option value="2">Has moderate difficulty hearing and understanding simple, one-step instructions and brief conversation; needs frequent prompting or assistance</option>
        <option value="3">Has severe difficulty hearing and understanding simple greetings and short comments. Requires multiple repetitions, restatements, demonstrations, additional time</option>
        <option value="4">Unable to hear and understand familiar words or common expressions consistently, or patient nonresponsive</option>
      </select>
    </div>
  </div>
);

/**
 * Section E: Skin Conditions
 */
export const renderSectionE = (formData, handleChange, isFieldSkipped) => (
  <div className="oasis-section">
    <h2>Section E: Skin Conditions</h2>
    <p className="section-description">Pressure ulcers, stasis ulcers, and surgical wounds</p>

    {/* Pressure Ulcers */}
    <h3>Pressure Ulcers/Injuries</h3>
    
    <div className="form-group">
      <label>M1306 - Does this patient have at least one Unhealed Pressure Ulcer/Injury at Stage 2 or Higher or designated as Unstageable?</label>
      <select name="m1306PressureUlcer" value={formData.m1306PressureUlcer} onChange={handleChange}>
        <option value="">Select...</option>
        <option value="0">No [Go to M1330]</option>
        <option value="1">Yes</option>
      </select>
    </div>

    {!isFieldSkipped('m1307OldestStage2Date') && (
      <div className="form-group">
        <label>M1307 - The Oldest Stage 2 Pressure Ulcer that is present at discharge</label>
        <input type="date" name="m1307OldestStage2Date" value={formData.m1307OldestStage2Date} onChange={handleChange} />
      </div>
    )}

    {!isFieldSkipped('m1308Stage1Count') && (
      <>
        <h4>M1308 - Current Number of Unhealed Pressure Ulcers/Injuries at Each Stage</h4>
        <div className="form-group">
          <label>Stage 1: Intact skin with non-blanchable redness</label>
          <input type="number" name="m1308Stage1Count" value={formData.m1308Stage1Count} onChange={handleChange} min="0" />
        </div>
        <div className="form-group">
          <label>Stage 2: Partial thickness loss of dermis</label>
          <input type="number" name="m1308Stage2Count" value={formData.m1308Stage2Count} onChange={handleChange} min="0" />
        </div>
        <div className="form-group">
          <label>Stage 3: Full thickness tissue loss</label>
          <input type="number" name="m1308Stage3Count" value={formData.m1308Stage3Count} onChange={handleChange} min="0" />
        </div>
        <div className="form-group">
          <label>Stage 4: Full thickness tissue loss with exposed bone, tendon or muscle</label>
          <input type="number" name="m1308Stage4Count" value={formData.m1308Stage4Count} onChange={handleChange} min="0" />
        </div>
      </>
    )}

    {!isFieldSkipped('m1311UnstageableDressing') && (
      <>
        <h4>M1311 - Current Number of Unstageable Pressure Ulcers/Injuries</h4>
        <div className="form-group">
          <label>Unstageable: Non-removable dressing/device</label>
          <input type="number" name="m1311UnstageableDressing" value={formData.m1311UnstageableDressing} onChange={handleChange} min="0" />
        </div>
        <div className="form-group">
          <label>Unstageable: Slough and/or eschar</label>
          <input type="number" name="m1311UnstageableSlough" value={formData.m1311UnstageableSlough} onChange={handleChange} min="0" />
        </div>
        <div className="form-group">
          <label>Unstageable: Deep tissue injury</label>
          <input type="number" name="m1311UnstageableDeepTissue" value={formData.m1311UnstageableDeepTissue} onChange={handleChange} min="0" />
        </div>
      </>
    )}

    {!isFieldSkipped('m1320PressureUlcerStatus') && (
      <div className="form-group">
        <label>M1320 - Status of Most Problematic (Observable) Pressure Ulcer</label>
        <select name="m1320PressureUlcerStatus" value={formData.m1320PressureUlcerStatus} onChange={handleChange}>
          <option value="">Select...</option>
          <option value="1">Completely epithelialized/resurfaced</option>
          <option value="2">Early/partial granulation</option>
          <option value="3">Fully granulating</option>
          <option value="4">Not healing</option>
        </select>
      </div>
    )}

    {/* Stasis Ulcers */}
    <h3>Stasis Ulcers</h3>
    
    <div className="form-group">
      <label>M1330 - Does this patient have at least one Unhealed Stasis Ulcer?</label>
      <select name="m1330StasisUlcer" value={formData.m1330StasisUlcer} onChange={handleChange}>
        <option value="">Select...</option>
        <option value="0">No [Go to M1340]</option>
        <option value="1">Yes</option>
      </select>
    </div>

    {!isFieldSkipped('m1332StasisUlcerCount') && (
      <div className="form-group">
        <label>M1332 - Current Number of Unhealed Stasis Ulcers</label>
        <input type="number" name="m1332StasisUlcerCount" value={formData.m1332StasisUlcerCount} onChange={handleChange} min="0" />
      </div>
    )}

    {!isFieldSkipped('m1334StasisUlcerStatus') && (
      <div className="form-group">
        <label>M1334 - Status of Most Problematic (Observable) Stasis Ulcer</label>
        <select name="m1334StasisUlcerStatus" value={formData.m1334StasisUlcerStatus} onChange={handleChange}>
          <option value="">Select...</option>
          <option value="1">Completely epithelialized/resurfaced</option>
          <option value="2">Early/partial granulation</option>
          <option value="3">Fully granulating</option>
          <option value="4">Not healing</option>
        </select>
      </div>
    )}

    {/* Surgical Wounds */}
    <h3>Surgical Wounds</h3>
    
    <div className="form-group">
      <label>M1340 - Does this patient have a Surgical Wound?</label>
      <select name="m1340SurgicalWound" value={formData.m1340SurgicalWound} onChange={handleChange}>
        <option value="">Select...</option>
        <option value="0">No [Go to M1400]</option>
        <option value="1">Yes</option>
      </select>
    </div>

    {!isFieldSkipped('m1342SurgicalWoundStatus') && (
      <div className="form-group">
        <label>M1342 - Status of Most Problematic (Observable) Surgical Wound</label>
        <select name="m1342SurgicalWoundStatus" value={formData.m1342SurgicalWoundStatus} onChange={handleChange}>
          <option value="">Select...</option>
          <option value="0">Newly epithelialized</option>
          <option value="1">Fully granulating</option>
          <option value="2">Early/partial granulation</option>
          <option value="3">Not healing</option>
        </select>
      </div>
    )}
  </div>
);

/**
 * Section F: Respiratory Status
 */
export const renderSectionF = (formData, handleChange) => (
  <div className="oasis-section">
    <h2>Section F: Respiratory Status</h2>
    <p className="section-description">Dyspnea and respiratory treatments</p>

    <div className="form-group">
      <label>M1400 - When is the patient dyspneic or noticeably Short of Breath?</label>
      <select name="m1400Dyspnea" value={formData.m1400Dyspnea} onChange={handleChange}>
        <option value="">Select...</option>
        <option value="0">Patient is not short of breath</option>
        <option value="1">When walking more than 20 feet, climbing stairs</option>
        <option value="2">With moderate exertion (e.g., while dressing, using commode or bedpan, walking distances less than 20 feet)</option>
        <option value="3">With minimal exertion (e.g., while eating, talking, or performing other ADLs) or with agitation</option>
        <option value="4">At rest (during day or night)</option>
      </select>
    </div>

    <div className="form-group">
      <label>M1410 - Respiratory Treatments utilized at home</label>
      <p>Check all that apply</p>
      <div className="checkbox-group">
        <label>
          <input type="checkbox" name="m1410Oxygen" checked={formData.m1410RespiratoryTreatments?.includes('oxygen')} onChange={handleChange} />
          Oxygen (intermittent or continuous)
        </label>
        <label>
          <input type="checkbox" name="m1410Ventilator" checked={formData.m1410RespiratoryTreatments?.includes('ventilator')} onChange={handleChange} />
          Ventilator (invasive or non-invasive)
        </label>
        <label>
          <input type="checkbox" name="m1410Airway" checked={formData.m1410RespiratoryTreatments?.includes('airway')} onChange={handleChange} />
          Airway suctioning
        </label>
        <label>
          <input type="checkbox" name="m1410None" checked={formData.m1410RespiratoryTreatments?.includes('none')} onChange={handleChange} />
          None of the above
        </label>
      </div>
    </div>
  </div>
);

/**
 * Section G: Elimination Status
 */
export const renderSectionG = (formData, handleChange, isFieldSkipped) => (
  <div className="oasis-section">
    <h2>Section G: Elimination Status</h2>
    <p className="section-description">Urinary and bowel function</p>

    <div className="form-group">
      <label>M1600 - Has this patient been treated for a Urinary Tract Infection in the past 14 days?</label>
      <select name="m1600UtiTreatment" value={formData.m1600UtiTreatment} onChange={handleChange}>
        <option value="">Select...</option>
        <option value="0">No</option>
        <option value="1">Yes</option>
        <option value="NA">Patient on prophylactic treatment</option>
        <option value="UK">Unknown</option>
      </select>
    </div>

    <div className="form-group">
      <label>M1610 - Urinary Incontinence or Urinary Catheter Presence</label>
      <select name="m1610UrinaryIncontinence" value={formData.m1610UrinaryIncontinence} onChange={handleChange}>
        <option value="">Select...</option>
        <option value="0">No incontinence or catheter (includes anuria or ostomy for urinary drainage) [Go to M1620]</option>
        <option value="1">Patient is incontinent</option>
        <option value="2">Patient requires a urinary catheter (external, indwelling, intermittent, or suprapubic) [Go to M1620]</option>
      </select>
    </div>

    {!isFieldSkipped('m1615IncontinenceTiming') && (
      <div className="form-group">
        <label>M1615 - When does Urinary Incontinence occur?</label>
        <select name="m1615IncontinenceTiming" value={formData.m1615IncontinenceTiming} onChange={handleChange}>
          <option value="">Select...</option>
          <option value="0">Timed-voiding defers incontinence</option>
          <option value="1">During the night only</option>
          <option value="2">During the day and night</option>
        </select>
      </div>
    )}

    <div className="form-group">
      <label>M1620 - Bowel Incontinence Frequency</label>
      <select name="m1620BowelIncontinence" value={formData.m1620BowelIncontinence} onChange={handleChange}>
        <option value="">Select...</option>
        <option value="0">Very rarely or never has bowel incontinence</option>
        <option value="1">Less than once weekly</option>
        <option value="2">One to three times weekly</option>
        <option value="3">Four to six times weekly</option>
        <option value="4">On a daily basis</option>
        <option value="5">More often than once daily</option>
        <option value="NA">Patient has ostomy for bowel elimination</option>
        <option value="UK">Unknown</option>
      </select>
    </div>

    <div className="form-group">
      <label>M1630 - Ostomy for Bowel Elimination</label>
      <p>Does this patient have an ostomy for bowel elimination that (within the last 14 days): a) was related to an inpatient facility stay, or b) necessitated a change in medical or treatment regimen?</p>
      <select name="m1630Ostomy" value={formData.m1630Ostomy} onChange={handleChange}>
        <option value="">Select...</option>
        <option value="0">Patient does not have an ostomy for bowel elimination</option>
        <option value="1">Patient's ostomy was not related to an inpatient stay and did not necessitate change in medical or treatment regimen</option>
        <option value="2">The ostomy was related to an inpatient stay or did necessitate change in medical or treatment regimen</option>
      </select>
    </div>
  </div>
);

/**
 * Section H: Cardiac Status
 */
export const renderSectionH = (formData, handleChange) => (
  <div className="oasis-section">
    <h2>Section H: Cardiac Status</h2>
    <p className="section-description">Heart failure symptoms</p>

    <div className="form-group">
      <label>M1500 - Symptoms in Heart Failure Patients</label>
      <p>If patient has been diagnosed with heart failure, did the patient exhibit symptoms indicated by clinical heart failure guidelines (including dyspnea, orthopnea, edema, or weight gain) at any point since the previous OASIS assessment?</p>
      <select name="m1500HeartFailureSymptoms" value={formData.m1500HeartFailureSymptoms} onChange={handleChange}>
        <option value="">Select...</option>
        <option value="0">No</option>
        <option value="1">Yes</option>
        <option value="2">Not assessed [Go to M1600]</option>
        <option value="NA">Patient does not have diagnosis of heart failure [Go to M1600]</option>
      </select>
    </div>
  </div>
);

/**
 * Section I: Neurological/Emotional/Behavioral Status
 */
export const renderSectionI = (formData, handleChange) => (
  <div className="oasis-section">
    <h2>Section I: Neurological/Emotional/Behavioral Status</h2>
    <p className="section-description">Cognitive function, confusion, anxiety, depression, and behavioral symptoms</p>

    <div className="form-group">
      <label>M1700 - Cognitive Functioning</label>
      <p>Patient's current level of alertness, orientation, comprehension, concentration, and immediate memory for simple commands</p>
      <select name="m1700CognitiveFunctioning" value={formData.m1700CognitiveFunctioning} onChange={handleChange}>
        <option value="">Select...</option>
        <option value="0">Alert/oriented, able to focus and shift attention, comprehends and recalls task directions independently</option>
        <option value="1">Requires prompting (cuing, repetition, reminders) only under stressful or unfamiliar conditions</option>
        <option value="2">Requires assistance and some direction in specific situations or consistently requires low stimulus environment</option>
        <option value="3">Requires considerable assistance in routine situations. Is not alert and oriented or is unable to shift attention and recall directions more than half the time</option>
        <option value="4">Totally dependent due to disturbances such as constant disorientation, coma, persistent vegetative state, or delirium</option>
      </select>
    </div>

    <div className="form-group">
      <label>M1710 - When Confused (Reported or Observed)</label>
      <select name="m1710WhenConfused" value={formData.m1710WhenConfused} onChange={handleChange}>
        <option value="">Select...</option>
        <option value="0">Never</option>
        <option value="1">In new or complex situations only</option>
        <option value="2">On awakening or at night only</option>
        <option value="3">During the day and evening, but not constantly</option>
        <option value="4">Constantly</option>
        <option value="NA">Patient nonresponsive</option>
      </select>
    </div>

    <div className="form-group">
      <label>M1720 - When Anxious (Reported or Observed)</label>
      <select name="m1720WhenAnxious" value={formData.m1720WhenAnxious} onChange={handleChange}>
        <option value="">Select...</option>
        <option value="0">None of the time</option>
        <option value="1">Less often than daily</option>
        <option value="2">Daily, but not constantly</option>
        <option value="3">All of the time</option>
        <option value="NA">Patient nonresponsive</option>
      </select>
    </div>

    <div className="form-group">
      <label>M1730 - Depression Screening</label>
      <p>Has the patient been screened for depression using a standardized depression screening tool?</p>
      <select name="m1730DepressionScreening" value={formData.m1730DepressionScreening} onChange={handleChange}>
        <option value="">Select...</option>
        <option value="0">No</option>
        <option value="1">Yes, patient was screened using the PHQ-2© scale. The patient did not score 3 or higher (negative screen)</option>
        <option value="2">Yes, patient was screened using the PHQ-2© scale. The patient scored 3 or higher (positive screen)</option>
        <option value="3">Yes, patient was screened with a different standardized tool. The patient screened negative for depression</option>
        <option value="4">Yes, patient was screened with a different standardized tool. The patient screened positive for depression</option>
      </select>
    </div>

    <div className="form-group">
      <label>M1740 - Cognitive, Behavioral, and Psychiatric Symptoms</label>
      <p>Check all that apply</p>
      <div className="checkbox-group">
        <label>
          <input type="checkbox" name="m1740Memory" checked={formData.m1740PsychiatricSymptoms?.includes('memory')} onChange={handleChange} />
          Memory deficit
        </label>
        <label>
          <input type="checkbox" name="m1740Impaired" checked={formData.m1740PsychiatricSymptoms?.includes('impaired')} onChange={handleChange} />
          Impaired decision-making
        </label>
        <label>
          <input type="checkbox" name="m1740Verbal" checked={formData.m1740PsychiatricSymptoms?.includes('verbal')} onChange={handleChange} />
          Verbal disruption
        </label>
        <label>
          <input type="checkbox" name="m1740Physical" checked={formData.m1740PsychiatricSymptoms?.includes('physical')} onChange={handleChange} />
          Physical aggression
        </label>
        <label>
          <input type="checkbox" name="m1740Disruptive" checked={formData.m1740PsychiatricSymptoms?.includes('disruptive')} onChange={handleChange} />
          Disruptive, infantile, or socially inappropriate behavior
        </label>
        <label>
          <input type="checkbox" name="m1740Delusional" checked={formData.m1740PsychiatricSymptoms?.includes('delusional')} onChange={handleChange} />
          Delusional, hallucinatory, or paranoid behavior
        </label>
        <label>
          <input type="checkbox" name="m1740None" checked={formData.m1740PsychiatricSymptoms?.includes('none')} onChange={handleChange} />
          None of the above
        </label>
      </div>
    </div>

    <div className="form-group">
      <label>M1745 - Frequency of Disruptive Behavior Symptoms</label>
      <select name="m1745DisruptiveBehaviorFreq" value={formData.m1745DisruptiveBehaviorFreq} onChange={handleChange}>
        <option value="">Select...</option>
        <option value="0">Never</option>
        <option value="1">Less than once a month</option>
        <option value="2">Once a month</option>
        <option value="3">Several times each month</option>
        <option value="4">Several times a week</option>
        <option value="5">At least daily</option>
      </select>
    </div>
  </div>
);

/**
 * Section M: Medications
 */
export const renderSectionM = (formData, handleChange) => (
  <div className="oasis-section">
    <h2>Section M: Medications</h2>
    <p className="section-description">Drug regimen review, medication management, and interventions</p>

    <div className="form-group">
      <label>M2001 - Drug Regimen Review</label>
      <p>Does a complete drug regimen review indicate potential clinically significant medication issues?</p>
      <select name="m2001DrugRegimenReview" value={formData.m2001DrugRegimenReview} onChange={handleChange}>
        <option value="">Select...</option>
        <option value="0">No</option>
        <option value="1">Yes</option>
        <option value="NA">Patient is not taking any medications</option>
      </select>
    </div>

    <div className="form-group">
      <label>M2003 - Medication Follow-up</label>
      <p>Was a physician or the physician-designee contacted within one calendar day to resolve clinically significant medication issues?</p>
      <select name="m2003MedicationFollowup" value={formData.m2003MedicationFollowup} onChange={handleChange}>
        <option value="">Select...</option>
        <option value="0">No</option>
        <option value="1">Yes</option>
        <option value="NA">No clinically significant medication issues identified</option>
      </select>
    </div>

    <div className="form-group">
      <label>M2005 - Medication Intervention</label>
      <p>Was a medication intervention (e.g., hold, discontinue, or reduce dose, or change medication) ordered by the physician or physician-designee within one calendar day of the agency contact?</p>
      <select name="m2005MedicationIntervention" value={formData.m2005MedicationIntervention} onChange={handleChange}>
        <option value="">Select...</option>
        <option value="0">No</option>
        <option value="1">Yes</option>
        <option value="NA">No clinically significant medication issues identified</option>
      </select>
    </div>

    <div className="form-group">
      <label>M2010 - Patient/Caregiver High Risk Drug Education</label>
      <p>Has the patient/caregiver received instruction on special precautions for all high-risk medications?</p>
      <select name="m2010HighRiskDrugEducation" value={formData.m2010HighRiskDrugEducation} onChange={handleChange}>
        <option value="">Select...</option>
        <option value="0">No</option>
        <option value="1">Yes</option>
        <option value="NA">Patient not taking any high-risk drugs OR patient/caregiver fully knowledgeable about special precautions</option>
      </select>
    </div>

    <div className="form-group">
      <label>M2015 - Patient/Caregiver Drug Education Intervention</label>
      <p>Since the previous OASIS assessment, was the patient/caregiver instructed by agency staff or other health care provider to monitor the effectiveness of drug therapy, drug reactions, and side effects, and how and when to report problems?</p>
      <select name="m2015DrugEducationIntervention" value={formData.m2015DrugEducationIntervention} onChange={handleChange}>
        <option value="">Select...</option>
        <option value="0">No</option>
        <option value="1">Yes</option>
        <option value="NA">Patient not taking any medications or patient/caregiver fully knowledgeable</option>
      </select>
    </div>

    <div className="form-group">
      <label>M2020 - Management of Oral Medications</label>
      <p>Patient's ability to prepare and take all oral medications reliably and safely</p>
      <select name="m2020OralMedicationManagement" value={formData.m2020OralMedicationManagement} onChange={handleChange}>
        <option value="">Select...</option>
        <option value="0">Able to independently take the correct oral medication(s) and proper dosage(s) at the correct times</option>
        <option value="1">Able to take medication(s) at the correct times if individual dosages are prepared in advance or if using a drug diary/chart</option>
        <option value="2">Unable to take medication unless administered by another person</option>
        <option value="NA">No oral medications prescribed</option>
      </select>
    </div>

    <div className="form-group">
      <label>M2030 - Management of Injectable Medications</label>
      <p>Patient's ability to prepare and take all prescribed injectable medications reliably and safely</p>
      <select name="m2030InjectableMedicationMgmt" value={formData.m2030InjectableMedicationMgmt} onChange={handleChange}>
        <option value="">Select...</option>
        <option value="0">Able to independently take the correct medication and proper dosage at the correct times</option>
        <option value="1">Able to take injectable medication at correct times if individual syringes are prepared in advance or if using a drug diary/chart</option>
        <option value="2">Unable to take injectable medication unless administered by another person</option>
        <option value="NA">No injectable medications prescribed</option>
      </select>
    </div>

    <div className="form-group">
      <label>M2040 - Prior Medication Management</label>
      <p>Indicate the ability level prior to the current illness, exacerbation, or injury</p>
      <select name="m2040PriorMedicationMgmt" value={formData.m2040PriorMedicationMgmt} onChange={handleChange}>
        <option value="">Select...</option>
        <option value="0">Able to independently take the correct medication and proper dosage at the correct times</option>
        <option value="1">Able to take medication at the correct times if individual dosages were prepared in advance or if using a drug diary/chart</option>
        <option value="2">Unable to take medication unless administered by another person</option>
        <option value="3">Unknown</option>
      </select>
    </div>
  </div>
);

/**
 * Section N: Care Management
 */
export const renderSectionN = (formData, handleChange) => (
  <div className="oasis-section">
    <h2>Section N: Care Management</h2>
    <p className="section-description">Types and sources of assistance</p>

    <div className="form-group">
      <label>M2102 - Types and Sources of Assistance</label>
      <p>Check all that apply for assistance received by the patient</p>
      <div className="checkbox-group">
        <label>
          <input type="checkbox" name="m2102Adl" checked={formData.m2102AssistanceTypes?.includes('adl')} onChange={handleChange} />
          ADL assistance (e.g., bathing, dressing, toileting, bowel/bladder, eating/feeding)
        </label>
        <label>
          <input type="checkbox" name="m2102Iadl" checked={formData.m2102AssistanceTypes?.includes('iadl')} onChange={handleChange} />
          IADL assistance (e.g., meals, housekeeping, laundry, telephone, shopping, finances)
        </label>
        <label>
          <input type="checkbox" name="m2102Medication" checked={formData.m2102AssistanceTypes?.includes('medication')} onChange={handleChange} />
          Medication administration
        </label>
        <label>
          <input type="checkbox" name="m2102Medical" checked={formData.m2102AssistanceTypes?.includes('medical')} onChange={handleChange} />
          Medical procedures/treatments
        </label>
        <label>
          <input type="checkbox" name="m2102Management" checked={formData.m2102AssistanceTypes?.includes('management')} onChange={handleChange} />
          Management and evaluation of the patient care plan
        </label>
        <label>
          <input type="checkbox" name="m2102Supervision" checked={formData.m2102AssistanceTypes?.includes('supervision')} onChange={handleChange} />
          Supervision and safety
        </label>
        <label>
          <input type="checkbox" name="m2102Advocacy" checked={formData.m2102AssistanceTypes?.includes('advocacy')} onChange={handleChange} />
          Advocacy or facilitation of patient's participation in care
        </label>
        <label>
          <input type="checkbox" name="m2102None" checked={formData.m2102AssistanceTypes?.includes('none')} onChange={handleChange} />
          None of the above
        </label>
      </div>
    </div>

    <div className="form-group">
      <label>M2110 - How Often does the patient receive ADL or IADL assistance from any caregiver?</label>
      <select name="m2110AssistanceFrequency" value={formData.m2110AssistanceFrequency} onChange={handleChange}>
        <option value="">Select...</option>
        <option value="0">At least daily</option>
        <option value="1">Three or more times per week</option>
        <option value="2">One to two times per week</option>
        <option value="3">Received, but less often than weekly</option>
        <option value="4">No assistance received</option>
        <option value="UK">Unknown</option>
      </select>
    </div>
  </div>
);

/**
 * Section P: Immunization
 */
export const renderSectionP = (formData, handleChange) => (
  <div className="oasis-section">
    <h2>Section P: Immunization</h2>
    <p className="section-description">Influenza and pneumococcal vaccination</p>

    <div className="form-group">
      <label>M1041 - Influenza Vaccine Data Collection Period</label>
      <p>Does this episode of care include any dates on or between October 1 and March 31?</p>
      <select name="m1041InfluenzaVaccinePeriod" value={formData.m1041InfluenzaVaccinePeriod} onChange={handleChange}>
        <option value="">Select...</option>
        <option value="0">No</option>
        <option value="1">Yes</option>
      </select>
    </div>

    <div className="form-group">
      <label>M1046 - Influenza Vaccine Received</label>
      <p>Did the patient receive the influenza vaccine from your agency for this year's influenza season?</p>
      <select name="m1046InfluenzaVaccineReceived" value={formData.m1046InfluenzaVaccineReceived} onChange={handleChange}>
        <option value="">Select...</option>
        <option value="0">No</option>
        <option value="1">Yes</option>
        <option value="2">Patient offered and declined</option>
        <option value="3">Patient already received from another provider</option>
        <option value="4">Not indicated; patient does not meet age/condition guidelines</option>
        <option value="5">Not indicated; patient meets exclusion criteria</option>
        <option value="6">Unable to obtain vaccine due to declared shortage</option>
      </select>
    </div>

    <div className="form-group">
      <label>M1051 - Pneumococcal Vaccine Ever Received</label>
      <p>Has the patient ever received the pneumococcal vaccine?</p>
      <select name="m1051PneumococcalVaccine" value={formData.m1051PneumococcalVaccine} onChange={handleChange}>
        <option value="">Select...</option>
        <option value="0">No</option>
        <option value="1">Yes</option>
        <option value="2">Unknown</option>
      </select>
    </div>
  </div>
);

/**
 * Section Q: Emergent Care and Discharge
 */
export const renderSectionQ = (formData, handleChange, isFieldSkipped) => (
  <div className="oasis-section">
    <h2>Section Q: Emergent Care and Discharge</h2>
    <p className="section-description">Emergent care utilization and discharge disposition</p>

    <div className="form-group">
      <label>M2310 - Emergent Care</label>
      <p>Since the last time OASIS data were collected, has the patient utilized any of the following services for emergent care?</p>
      <select name="m2310EmergentCare" value={formData.m2310EmergentCare} onChange={handleChange}>
        <option value="">Select...</option>
        <option value="0">No [Go to M2420]</option>
        <option value="1">Yes, used hospital emergency department (includes 23-hour holding)</option>
        <option value="2">Yes, admitted to hospital</option>
        <option value="3">Yes, admitted to hospital overnight (with or without ED visit)</option>
        <option value="UK">Unknown [Go to M2420]</option>
      </select>
    </div>

    {!isFieldSkipped('m2410EmergentCareReason') && (
      <div className="form-group">
        <label>M2410 - Emergent Care Reason</label>
        <p>For what reason did the patient receive emergent care (with or without hospitalization)?</p>
        <select name="m2410EmergentCareReason" value={formData.m2410EmergentCareReason} onChange={handleChange}>
          <option value="">Select...</option>
          <option value="01">Improper medication administration, adverse drug reactions, medication side effects, toxicity, anaphylaxis</option>
          <option value="02">Injury caused by fall</option>
          <option value="03">Respiratory infection (e.g., pneumonia, bronchitis)</option>
          <option value="04">Other respiratory problems</option>
          <option value="05">Heart failure (e.g., fluid overload)</option>
          <option value="06">Cardiac dysrhythmia (irregular heartbeat)</option>
          <option value="07">Myocardial infarction or chest pain</option>
          <option value="08">Other heart disease</option>
          <option value="09">Stroke (CVA) or TIA</option>
          <option value="10">Hypo/Hyperglycemia, diabetes out of control</option>
          <option value="11">GI bleeding, obstruction, constipation, impaction</option>
          <option value="12">Dehydration, malnutrition</option>
          <option value="13">Urinary tract infection</option>
          <option value="14">IV catheter-related infection or complication</option>
          <option value="15">Wound infection or deteriorating wound status</option>
          <option value="16">Uncontrolled pain</option>
          <option value="17">Acute mental/behavioral health issue</option>
          <option value="18">Deep vein thrombosis, pulmonary embolus</option>
          <option value="19">Scheduled treatment or procedure</option>
          <option value="20">Other than above reasons</option>
          <option value="UK">Reason unknown</option>
        </select>
      </div>
    )}

    <div className="form-group">
      <label>M2420 - Discharge Disposition</label>
      <p>Where is the patient after discharge from your agency?</p>
      <select name="m2420DischargeDisposition" value={formData.m2420DischargeDisposition} onChange={handleChange}>
        <option value="">Select...</option>
        <option value="01">Patient remained in the community (not in hospital, nursing home, or rehab facility)</option>
        <option value="02">Patient transferred to a noninstitutional hospice</option>
        <option value="03">Patient transferred to a hospital</option>
        <option value="04">Patient transferred to a rehabilitation facility</option>
        <option value="05">Patient transferred to a nursing home</option>
        <option value="06">Patient transferred to another home health agency</option>
        <option value="07">Patient died at home</option>
        <option value="08">Patient died in a medical facility</option>
        <option value="UK">Unknown</option>
      </select>
    </div>
  </div>
);

export default {
  renderSectionC,
  renderSectionD,
  renderSectionE,
  renderSectionF,
  renderSectionG,
  renderSectionH,
  renderSectionI,
  renderSectionM,
  renderSectionN,
  renderSectionP,
  renderSectionQ,
};

