# DEFINITION OF READY & DEFINITION OF DONE

> **Project**: SDS Taman Harapan CMS - Sistem Manajemen Siswa dan Raport Digital  
> **Version**: 1.0  
> **Last Updated**: 2026-05-21

---

## Definition of Ready (DoR)

Sebuah User Story dianggap **Ready** untuk dikerjakan jika memenuhi kriteria berikut:

### 1. Story Requirements
- [ ] User Story ditulis dalam format standar: "As a [role], I want [feature], so that [benefit]"
- [ ] Acceptance Criteria jelas dan testable
- [ ] Story tidak terlalu besar (max 8 SP, idealnya 3-5 SP)
- [ ] Dependencies sudah diidentifikasi dan resolved

### 2. Technical Requirements
- [ ] Technical approach sudah didiskusikan
- [ ] API contract sudah didefinisikan (jika ada)
- [ ] Database schema sudah jelas (jika ada perubahan)
- [ ] UI mockup/wireframe tersedia (untuk frontend tasks)

### 3. Team Alignment
- [ ] Story sudah di-review oleh tim
- [ ] Estimasi sudah disepakati
- [ ] Tidak ada pertanyaan yang belum terjawab
- [ ] Owner/assignee sudah ditentukan

### DoR Checklist Template
```markdown
## DoR Checklist - [Story ID]

### Story
- [ ] Format user story benar
- [ ] Acceptance criteria lengkap
- [ ] Story size ≤ 8 SP

### Technical
- [ ] Technical approach clear
- [ ] API contract defined
- [ ] DB changes documented
- [ ] UI mockup available

### Team
- [ ] Team reviewed
- [ ] Estimation agreed
- [ ] No open questions
- [ ] Owner assigned
```

---

## Definition of Done (DoD)

Sebuah User Story dianggap **Done** jika memenuhi SEMUA kriteria berikut:

### 1. Code Quality

#### 1.1 Code Standards
- [ ] Code mengikuti project coding standards
- [ ] TypeScript strict mode - no `any` types
- [ ] Proper error handling implemented
- [ ] No console.log/debug statements
- [ ] Code is self-documenting dengan nama yang jelas

#### 1.2 Code Review
- [ ] Pull Request dibuat dengan deskripsi yang jelas
- [ ] Code di-review oleh minimal 1 team member
- [ ] Review comments addressed
- [ ] PR approved

### 2. Testing

#### 2.1 Manual Testing
- [ ] Feature tested di local environment
- [ ] Happy path tested
- [ ] Edge cases tested
- [ ] Error scenarios tested

#### 2.2 Cross-browser Testing (Frontend)
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest) - jika applicable
- [ ] Mobile responsive tested

#### 2.3 Automated Testing (jika applicable)
- [ ] Unit tests written untuk logic baru
- [ ] Tests passing
- [ ] No regression pada existing tests

### 3. Documentation

#### 3.1 Code Documentation
- [ ] Complex functions memiliki JSDoc comments
- [ ] API endpoints documented
- [ ] README updated jika ada setup baru

#### 3.2 User Documentation
- [ ] User-facing changes documented
- [ ] Screenshots/GIFs untuk fitur baru (jika perlu)

### 4. Deployment

#### 4.1 Build
- [ ] Build berhasil tanpa errors
- [ ] No TypeScript errors
- [ ] No ESLint warnings/errors

#### 4.2 Database
- [ ] Migration file dibuat (jika ada DB changes)
- [ ] Migration tested di local
- [ ] Rollback plan documented

#### 4.3 Environment
- [ ] Environment variables documented
- [ ] No hardcoded secrets
- [ ] Config changes documented

### 5. Acceptance

#### 5.1 Acceptance Criteria
- [ ] SEMUA acceptance criteria terpenuhi
- [ ] Demo ke stakeholder (jika diperlukan)
- [ ] Stakeholder sign-off (untuk major features)

#### 5.2 Integration
- [ ] Feature terintegrasi dengan baik dengan existing system
- [ ] No breaking changes pada existing features
- [ ] Performance acceptable

---

## DoD Checklist by Story Type

### Backend/API Story
```markdown
## DoD Checklist - Backend

### Code
- [ ] API endpoint implemented
- [ ] Input validation dengan Zod
- [ ] Error handling proper
- [ ] TypeScript types defined
- [ ] No any types

### Testing
- [ ] Endpoint tested dengan Postman/Thunder Client
- [ ] Happy path works
- [ ] Error cases handled
- [ ] Edge cases tested

### Documentation
- [ ] API documented (endpoint, params, response)
- [ ] Error codes documented

### Database
- [ ] Migration created (if needed)
- [ ] RLS policies set
- [ ] Indexes created (if needed)

### Review
- [ ] PR created
- [ ] Code reviewed
- [ ] PR approved & merged
```

### Frontend Story
```markdown
## DoD Checklist - Frontend

### Code
- [ ] Component implemented
- [ ] TypeScript types proper
- [ ] Responsive design
- [ ] Accessibility (keyboard nav, aria labels)
- [ ] Loading states
- [ ] Error states

### Testing
- [ ] Manual testing done
- [ ] Chrome tested
- [ ] Mobile tested
- [ ] Edge cases tested

### UX
- [ ] Matches design/mockup
- [ ] Consistent with design system
- [ ] Toast notifications for actions
- [ ] Form validation messages

### Review
- [ ] PR created
- [ ] Code reviewed
- [ ] PR approved & merged
```

### Full-stack Story
```markdown
## DoD Checklist - Full-stack

### Backend
- [ ] API endpoint implemented
- [ ] Input validation
- [ ] Error handling
- [ ] Database changes (if any)

### Frontend
- [ ] UI component implemented
- [ ] API integration
- [ ] Loading/error states
- [ ] Responsive design

### Integration
- [ ] E2E flow tested
- [ ] Data flows correctly
- [ ] Error handling E2E

### Review
- [ ] PR created
- [ ] Code reviewed
- [ ] PR approved & merged
```

---

## Sprint-level Definition of Done

Sprint dianggap **Done** jika:

### Deliverables
- [ ] Semua committed stories Done (sesuai DoD)
- [ ] Sprint goal tercapai
- [ ] No critical bugs

### Quality
- [ ] Build passing
- [ ] No regression bugs
- [ ] Performance acceptable

### Process
- [ ] Sprint review conducted
- [ ] Demo ke stakeholder
- [ ] Sprint retrospective conducted
- [ ] Backlog updated

---

## Release Definition of Done

Release dianggap **Done** jika:

### Quality Gates
- [ ] All sprint DoDs met
- [ ] E2E testing passed
- [ ] Performance testing passed
- [ ] Security review passed
- [ ] UAT sign-off

### Documentation
- [ ] Release notes written
- [ ] User documentation updated
- [ ] API documentation updated
- [ ] Deployment guide updated

### Deployment
- [ ] Staging deployment successful
- [ ] Smoke tests passed on staging
- [ ] Production deployment successful
- [ ] Smoke tests passed on production
- [ ] Monitoring configured

### Communication
- [ ] Stakeholders notified
- [ ] Users notified (if applicable)
- [ ] Support team briefed

---

## Quality Standards

### Code Quality Metrics
| Metric | Target |
|--------|--------|
| TypeScript Strict | Enabled |
| ESLint Errors | 0 |
| Console Errors | 0 |
| Build Warnings | < 5 |

### Performance Targets
| Metric | Target |
|--------|--------|
| Page Load Time | < 2s |
| API Response Time | < 500ms |
| PDF Generation | < 5s |
| Email Sending | < 10s |

### Accessibility Standards
| Standard | Target |
|----------|--------|
| Keyboard Navigation | All interactive elements |
| Color Contrast | WCAG AA |
| Screen Reader | Basic support |
| Focus Indicators | Visible |

---

## Exception Handling

### When DoD Cannot Be Fully Met

1. **Document the exception** - Apa yang tidak terpenuhi dan mengapa
2. **Create follow-up ticket** - Untuk menyelesaikan item yang tertunda
3. **Get approval** - Dari Product Owner untuk proceed
4. **Track as tech debt** - Jika applicable

### Acceptable Exceptions
- Minor documentation updates (dapat di-follow up)
- Non-critical browser support (Safari edge cases)
- Performance optimization (jika masih dalam acceptable range)

### Not Acceptable Exceptions
- Security issues
- Critical bugs
- Core functionality broken
- Data integrity issues

---

## Appendix: Checklist Templates

### Quick DoD Checklist (Copy-paste untuk PR)
```markdown
## DoD Checklist

### Code
- [ ] TypeScript strict, no `any`
- [ ] Error handling implemented
- [ ] No console.log statements

### Testing
- [ ] Manual testing done
- [ ] Edge cases tested
- [ ] Responsive tested (if frontend)

### Documentation
- [ ] Code documented where needed
- [ ] API documented (if applicable)

### Acceptance
- [ ] All AC met
- [ ] No breaking changes
```

### PR Description Template
```markdown
## Description
[Brief description of changes]

## Related Issue
Closes #[issue-number]

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## DoD Checklist
- [ ] Code follows project standards
- [ ] Self-reviewed my code
- [ ] Added necessary documentation
- [ ] No new warnings
- [ ] Tested manually
- [ ] All AC met

## Screenshots (if applicable)
[Add screenshots here]

## Additional Notes
[Any additional context]
```
