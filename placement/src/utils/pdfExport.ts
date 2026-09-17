import { Company, GeneratedFormConfig } from '../types';
import { ADITHYA_LOGO_SVG_DATA_URL } from '../components/AdithyaLogo';

export function exportPlacementFormToPDF(company: Company, config?: GeneratedFormConfig) {
  const printWindow = window.open('', '_blank', 'width=950,height=1100');
  if (!printWindow) {
    alert('Please allow popups to download/print the PDF placement form.');
    return;
  }

  const generatedDate = new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  const refNo = company.circularRefNo || `42 / ${new Date().getFullYear()}-${new Date().getFullYear() + 1} / TPC`;
  const circularDate = company.circularDate || company.recruitmentDate || '29.12.2025';
  const batchYear = company.year || '2026';
  const customFields = company.customFields || config?.customFields || [];

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>CAMPUS DRIVE CIRCULAR - ${company.name}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 10mm 12mm 12mm 12mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #090d16;
            background-color: #ffffff;
            margin: 0;
            padding: 15px;
            font-size: 11px;
            line-height: 1.4;
          }
          .a4-container {
            width: 100%;
            max-width: 210mm;
            margin: 0 auto;
            background: #ffffff;
            border: 2px solid #0f172a;
            padding: 24px;
          }
          .header-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 11px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 8px;
            margin-bottom: 12px;
          }
          .doc-banner {
            background-color: #0f172a;
            color: #ffffff;
            text-align: center;
            padding: 8px 12px;
            font-size: 13px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            margin-top: 6px;
            border-radius: 2px;
          }
          table.circular-table {
            width: 100%;
            border-collapse: collapse;
            border: 2px solid #0f172a;
            margin-top: 15px;
            font-size: 11px;
          }
          table.circular-table th, table.circular-table td {
            border: 1px solid #0f172a;
            padding: 8px 10px;
            text-align: left;
            vertical-align: top;
          }
          table.circular-table th {
            background-color: #f1f5f9;
            color: #0f172a;
            font-weight: 900;
            text-transform: uppercase;
            width: 28%;
            font-size: 10.5px;
          }
          table.circular-table td {
            font-weight: 700;
            color: #0f172a;
          }
          .footer-signatories {
            margin-top: 40px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            padding: 0 20px;
          }
          .sig-box {
            text-align: center;
          }
          .sig-title {
            font-weight: 900;
            font-size: 11px;
            text-transform: uppercase;
            color: #0f172a;
          }
          .sig-sub {
            font-size: 9px;
            color: #64748b;
            font-weight: 700;
            text-transform: uppercase;
            margin-top: 2px;
          }
          .footer-meta {
            margin-top: 25px;
            text-align: center;
            font-size: 8.5px;
            color: #64748b;
            border-top: 1px solid #cbd5e1;
            padding-top: 6px;
            font-family: monospace;
          }
        </style>
      </head>
      <body>
        <div class="a4-container">
          
          <div class="header-row">
            <span>CAMPUS DRIVE – CIRCULAR</span>
            <div>
              <span style="margin-right: 15px;">Ref No : <strong>${refNo}</strong></span>
              <span>Date : <strong>${circularDate}</strong></span>
            </div>
          </div>

          <div class="doc-banner">
            ${company.name} RECRUITMENT FOR THE BATCH OF ${batchYear}
          </div>

          <table class="circular-table">
            <tr>
              <th>Eligibility</th>
              <td>
                ${company.educationalQualification || company.allowedDepartments?.join(' / ') || 'B.E ( ECE / CSE / IT )'} 
                ${company.tenthCutoff ? `${company.tenthCutoff}% in 10th & 12th, ` : ''}
                CGPA: ${company.cgpaCutoff} & ABOVE 
                ${company.maxActiveArrears === 0 ? ' WITHOUT ANY STANDING ARREARS' : ` MAX ${company.maxActiveArrears} ARREARS`}
              </td>
            </tr>
            <tr>
              <th>Role</th>
              <td style="color: #1e3a8a; font-weight: 900;">${company.jobRole}</td>
            </tr>
            <tr>
              <th>Work Location</th>
              <td>${company.location || 'Chennai'}</td>
            </tr>
            <tr>
              <th>Drive Venue</th>
              <td>${company.driveVenue || 'Bannari Amman Institute of Technology, Sathyamangalam'}</td>
            </tr>
            ${(company.positionOverview || company.description) ? `
            <tr>
              <th>Position Overview</th>
              <td style="white-space: pre-line; font-weight: 500;">${company.positionOverview || company.description}</td>
            </tr>
            ` : ''}
            ${company.requiredSkills?.length ? `
            <tr>
              <th>Required Skill Sets</th>
              <td>${company.requiredSkills.join(', ')}</td>
            </tr>
            ` : ''}
            <tr>
              <th>Compensation</th>
              <td style="color: #065f46; font-weight: 900;">${company.salaryPackage}</td>
            </tr>
            ${company.bond ? `
            <tr>
              <th>Bond</th>
              <td>${company.bond}</td>
            </tr>
            ` : ''}
            ${company.selectionProcess ? `
            <tr>
              <th>Selection Process</th>
              <td style="white-space: pre-line;">${company.selectionProcess}</td>
            </tr>
            ` : ''}
            ${company.description ? `
            <tr>
              <th>About Company</th>
              <td style="font-weight: 500;">${company.description}</td>
            </tr>
            ` : ''}
            <tr>
              <th>LINK TO REGISTER</th>
              <td>
                <a href="${company.googleFormLink || '#'}" target="_blank" style="color: #1d4ed8; text-decoration: underline;">
                  ${company.googleFormLink || 'https://docs.google.com/forms/register'}
                </a>
                ${company.applicationDeadline ? `
                  <div style="color: #9f1239; font-weight: 900; margin-top: 4px;">
                    LINK WILL CLOSE BY ${company.applicationDeadline}
                  </div>
                ` : ''}
              </td>
            </tr>
            ${customFields.map(f => `
              <tr>
                <th>${f.label}</th>
                <td>${f.value !== undefined && f.value !== '' ? String(f.value) : (f.placeholder || '')}</td>
              </tr>
            `).join('')}
          </table>

          <div class="footer-signatories">
            <div class="sig-box">
              <div class="sig-title" style="margin-bottom: 35px;">HEAD – T&P</div>
              <div class="sig-sub">Training & Placement Cell</div>
            </div>
            <div class="sig-box">
              <div class="sig-title" style="margin-bottom: 35px;">PRINCIPAL</div>
              <div class="sig-sub">Adithya Institute of Technology</div>
            </div>
          </div>

          <div class="footer-meta">
            Generated on: ${generatedDate} &bull; Campus Drive Circular System &bull; Adithya Institute of Technology
          </div>

        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
