const path = require('path')

const { waitForApplication, getTemplateLink } = require('../../utils')

const startPageView = path.join(Cypress.env('projectFolder'), 'app', 'views', 'start.html')
const startPagePath = '/start'

const manageTemplatesPagePath = '/manage-prototype/templates'

describe('create new start page', () => {
  before(() => {
    waitForApplication(manageTemplatesPagePath)
    Cypress.on('uncaught:exception', (err, runnable) => {
      // we expect an error with message 'Cannot read properties of undefined (reading 'documentReady')'
      // and don't want to fail the test so we return false
      if (err.message.includes('Cannot read properties of undefined (reading \'documentReady\')')) {
        return false
      }
      // we still want to ensure there are no other unexpected
      // errors, so we let them fail the test
    })
    cy.task('deleteFile', { filename: startPageView })
    waitForApplication(manageTemplatesPagePath)
  })

  after(() => {
    cy.task('deleteFile', { filename: startPageView })
  })

  it('View the start page from the management page', () => {
    cy.task('log', 'Visit the manage prototype templates page')
    cy.get(`a[href="${getTemplateLink('view', 'govuk-prototype-kit', '/lib/templates/start.html')}"]`).click()

    cy.task('log', 'The start page template should be displayed')
    cy.get('.govuk-button--start')
      .should('contains.text', 'Start now')
  })

  it('Create the start page from the management page', () => {
    cy.task('log', 'The start page should not be found')
    cy.visit(startPagePath, { failOnStatusCode: false })
    cy.get('body')
      .should('contains.text', `Page not found: ${startPagePath}`)

    cy.task('log', 'Visit the manage prototype templates page')
    cy.visit(manageTemplatesPagePath)

    cy.get(`a[href="${getTemplateLink('install', 'govuk-prototype-kit', '/lib/templates/start.html')}"]`).click()

    cy.task('log', 'Create the page')
    cy.get('.govuk-heading-l')
      .should('contains.text', 'Create new Start page')
    cy.get('.govuk-label')
      .should('contains.text', 'Path for the new page')
    cy.get('#chosen-url')
      .type(startPagePath)
    cy.get('.govuk-button')
      .should('contains.text', 'Create page').click()

    cy.task('log', 'Confirmation page')
    cy.get('.govuk-heading-l')
      .should('contains.text', 'Page created')

    cy.task('log', 'Confirm the page exists')
    cy.get(`a[href="${startPagePath}"]`)
      .should('contains.text', startPagePath).click()
    cy.task('log', 'The start page should be displayed')
    cy.get('.govuk-button--start')
      .should('contains.text', 'Start now')

    cy.task('log', 'Confirm the view of the page exists where expected')
    cy.task('existsFile', { filename: startPageView })
  })

  describe('Invalid urls entered', () => {
    const errors = {
      exists: 'The chosen URL already exists',
      missing: 'The URL cannot be blank',
      singleSlash: 'The URL cannot be a single forward slash (/)',
      endsWithSlash: 'The URL cannot end in a forward slash (/)',
      slash: 'The URL must begin with a forward slash (/)',
      invalid: 'The URL entered is not a valid prototype url'
    }

    beforeEach(() => {
      cy.visit(manageTemplatesPagePath)
      cy.get(`a[href="${getTemplateLink('install', 'govuk-prototype-kit', '/lib/templates/start.html')}"]`).click()
    })

    it('already exists', () => {
      cy.get('input').type(startPagePath)
      cy.get('form').submit()
      cy.get('.govuk-error-summary__list').should('contains.text', errors.exists)
      cy.get('#chosen-url-error').should('contains.text', errors.exists)
    })

    it('empty', () => {
      cy.get('form').submit()
      cy.get('.govuk-error-summary__list').should('contains.text', errors.missing)
      cy.get('#chosen-url-error').should('contains.text', errors.missing)
    })

    it('empty (multiple spaces)', () => {
      cy.get('input').type('         ')
      cy.get('form').submit()
      cy.get('.govuk-error-summary__list').should('contains.text', errors.missing)
      cy.get('#chosen-url-error').should('contains.text', errors.missing)
    })

    it('single slash only', () => {
      cy.get('input').type('/')
      cy.get('form').submit()
      cy.get('.govuk-error-summary__list').should('contains.text', errors.singleSlash)
      cy.get('#chosen-url-error').should('contains.text', errors.singleSlash)
    })

    it('missing starting slash', () => {
      cy.get('input').type('foo/bar')
      cy.get('form').submit()
      cy.get('.govuk-error-summary__list').should('contains.text', errors.slash)
      cy.get('#chosen-url-error').should('contains.text', errors.slash)
    })

    it('ends with a slash', () => {
      cy.get('input').type('/foo/bar/')
      cy.get('form').submit()
      cy.get('.govuk-error-summary__list').should('contains.text', errors.endsWithSlash)
      cy.get('#chosen-url-error').should('contains.text', errors.endsWithSlash)
    })

    it('invalid (contains a search parameter)', () => {
      cy.get('input').type('/?param=true')
      cy.get('form').submit()
      cy.get('.govuk-error-summary__list').should('contains.text', errors.invalid)
      cy.get('#chosen-url-error').should('contains.text', errors.invalid)
    })

    it('invalid (contains spaces in the url)', () => {
      cy.get('input').type('/foo bar/baz bar')
      cy.get('form').submit()
      cy.get('.govuk-error-summary__list').should('contains.text', errors.invalid)
      cy.get('#chosen-url-error').should('contains.text', errors.invalid)
    })

    it('invalid (random)', () => {
      cy.get('input').type('/$$fr%%"pp')
      cy.get('form').submit()
      cy.get('.govuk-error-summary__list').should('contains.text', errors.invalid)
      cy.get('#chosen-url-error').should('contains.text', errors.invalid)
    })
  })
})
