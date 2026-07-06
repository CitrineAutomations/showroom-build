'use client'

import { useState } from 'react'
import { AnimatePresence, motion, MotionConfig } from 'framer-motion'
import StepIndicator from '@/components/StepIndicator'
import ConflictModal from '@/components/ConflictModal'
import Step0ClientRouter from '@/components/steps/Step0ClientRouter'
import Step1Identity from '@/components/steps/Step1Identity'
import Step2ClientType from '@/components/steps/Step2ClientType'
import Step3DriversLicense from '@/components/steps/Step3DriversLicense'
import Step4Payment from '@/components/steps/Step4Payment'
import Step4bPullDetails from '@/components/steps/Step4bPullDetails'
import Step4cItemEntry from '@/components/steps/Step4cItemEntry'
import Step5Photos from '@/components/steps/Step5Photos'
import SuccessScreen from '@/components/SuccessScreen'
import ReturnFlow from '@/components/ReturnFlow'

export type ClientType = 'RENTAL' | 'PUBLIC_RELATIONS'

export interface FormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  contactId: string | null
  hasCardOnFile: boolean
  existingStripeCustomerId: string | null
  clientType: ClientType | null
  dlFileIds: string[]
  stripeCustomerId: string | null
  cardKept: boolean
  pullId: string | null
  pullReturnDate: string | null
  pullPhotos: { id: string; name: string; url: string }[]
  isResumedClient: boolean
  photoFileIds: string[]
}

const TOTAL_STEPS = 8

const slideVariants = {
  enterForward:  { x: 24, opacity: 0 },
  enterBackward: { x: -24, opacity: 0 },
  center:        { x: 0, opacity: 1 },
  exitForward:   { x: -24, opacity: 0 },
  exitBackward:  { x: 24, opacity: 0 },
}

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward')
  const [showSuccess, setShowSuccess] = useState(false)
  const [showConflict, setShowConflict] = useState(false)
  const [showReturn, setShowReturn] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    contactId: null,
    hasCardOnFile: false,
    existingStripeCustomerId: null,
    clientType: null,
    dlFileIds: [],
    stripeCustomerId: null,
    cardKept: false,
    pullId: null,
    pullReturnDate: null,
    pullPhotos: [],
    isResumedClient: false,
    photoFileIds: [],
  })

  function updateForm(patch: Partial<FormData>) {
    setFormData(prev => ({ ...prev, ...patch }))
  }

  function goNext() {
    setDirection('forward')
    setStep(s => s + 1)
  }

  function goBack() {
    setDirection('backward')
    setStep(s => s - 1)
  }

  function handleStep1Complete(data: { firstName: string; lastName: string; email: string; phone: string; contactId: string; hasCardOnFile: boolean; existingStripeCustomerId: string | null }) {
    updateForm(data)
    goNext()
  }

  function handleNewClient() {
    goNext()
  }

  function handleExistingClientSelected(data: {
    firstName: string
    lastName: string
    email: string
    phone: string
    contactId: string
    hasCardOnFile: boolean
    existingStripeCustomerId: string | null
    clientType: ClientType | null
    pullId: string | null
    pullReturnDate: string | null
    pullPhotos: { id: string; name: string; url: string }[]
  }) {
    updateForm({ ...data, isResumedClient: true })
    goNext()
  }

  function handleStep4Entry() {
    if (formData.hasCardOnFile) {
      setShowConflict(true)
    }
  }

  function handleConflictKeep() {
    updateForm({ cardKept: true, stripeCustomerId: formData.existingStripeCustomerId })
    setShowConflict(false)
    goNext()
  }

  function handleConflictReplace() {
    setShowConflict(false)
  }

  function handleStep4Complete(stripeCustomerId: string) {
    updateForm({ stripeCustomerId })
    goNext()
  }

  function handlePullDetailsComplete(pullId: string) {
    updateForm({ pullId })
    goNext()
  }

  function handleComplete(photoFileIds: string[]) {
    updateForm({ photoFileIds })
    setShowSuccess(true)
  }

  function resetForm() {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      contactId: null,
      hasCardOnFile: false,
      existingStripeCustomerId: null,
      clientType: null,
      dlFileIds: [],
      stripeCustomerId: null,
      cardKept: false,
      pullId: null,
      pullReturnDate: null,
      pullPhotos: [],
      isResumedClient: false,
      photoFileIds: [],
    })
    setStep(1)
    setShowSuccess(false)
    setShowConflict(false)
  }

  if (showSuccess) {
    return (
      <MotionConfig reducedMotion="user">
        <div className="wordmark-bar">
          <span className="wordmark">DIVISION PR</span>
        </div>
        <SuccessScreen formData={formData} onReset={resetForm} />
      </MotionConfig>
    )
  }

  if (showReturn) {
    return (
      <MotionConfig reducedMotion="user">
        <div className="wordmark-bar">
          <span className="wordmark">DIVISION PR</span>
        </div>
        <ReturnFlow onDone={() => setShowReturn(false)} />
      </MotionConfig>
    )
  }

  const enterVariant = direction === 'forward' ? 'enterForward' : 'enterBackward'
  const exitVariant  = direction === 'forward' ? 'exitForward'  : 'exitBackward'

  return (
    <MotionConfig reducedMotion="user">
      <div className="wordmark-bar">
        <span className="wordmark">DIVISION PR</span>
      </div>

      <StepIndicator current={step} total={TOTAL_STEPS} />

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={step}
          variants={slideVariants}
          initial={enterVariant}
          animate="center"
          exit={exitVariant}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        >
          {step === 1 && (
            <Step0ClientRouter
              onNewClient={handleNewClient}
              onExistingClientSelected={handleExistingClientSelected}
              onReturn={() => setShowReturn(true)}
            />
          )}
          {step === 2 && (
            <Step1Identity
              initialData={{ firstName: formData.firstName, lastName: formData.lastName, email: formData.email, phone: formData.phone }}
              onComplete={handleStep1Complete}
            />
          )}
          {step === 3 && (
            <Step2ClientType
              selected={formData.clientType}
              onSelect={ct => updateForm({ clientType: ct })}
              onNext={goNext}
              onBack={goBack}
            />
          )}
          {step === 4 && (
            <Step3DriversLicense
              fileIds={formData.dlFileIds}
              isResumedClient={formData.isResumedClient}
              onFileIds={ids => updateForm({ dlFileIds: ids })}
              onNext={goNext}
              onBack={goBack}
            />
          )}
          {step === 5 && (
            <Step4Payment
              formData={formData}
              onEntry={handleStep4Entry}
              onComplete={handleStep4Complete}
              onSkip={() => { updateForm({ cardKept: true, stripeCustomerId: formData.existingStripeCustomerId }); goNext() }}
              onBack={goBack}
            />
          )}
          {step === 6 && (
            <Step4bPullDetails
              contactId={formData.contactId}
              clientName={`${formData.firstName} ${formData.lastName}`.trim()}
              initialReturnDate={formData.pullReturnDate}
              onComplete={handlePullDetailsComplete}
              onBack={goBack}
            />
          )}
          {step === 7 && (
            <Step4cItemEntry
              pullId={formData.pullId}
              onComplete={goNext}
              onBack={goBack}
            />
          )}
          {step === 8 && (
            <Step5Photos
              contactId={formData.contactId}
              pullId={formData.pullId}
              isResumedClient={formData.isResumedClient}
              existingPhotos={formData.pullPhotos}
              onComplete={handleComplete}
              onBack={goBack}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {showConflict && (
        <ConflictModal
          clientName={`${formData.firstName} ${formData.lastName}`.trim()}
          onKeep={handleConflictKeep}
          onReplace={handleConflictReplace}
        />
      )}
    </MotionConfig>
  )
}
