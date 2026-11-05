import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#64748b"))
        
        # Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(54, 755, "AURACAST — MULTIMEDIA SYSTEMS REVIEW & VIVA GUIDE")
            self.drawRightString(558, 755, "QUICK PRESENTATION CHEATSHEET")
            self.setStrokeColor(colors.HexColor("#cbd5e1"))
            self.setLineWidth(0.6)
            self.line(54, 748, 558, 748)
            
        # Footer
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.6)
        self.line(54, 45, 558, 45)
        
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))
        self.drawString(54, 32, "Confidential • Multimedia Systems Lab Project Review • Academic Defense")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 32, page_str)
        self.restoreState()

def build_pdf():
    pdf_filename = r"c:\Users\khakh\Desktop\MULTIMEDIA PROJECT\AuraCast_Review_Quick_Guide.pdf"
    doc = SimpleDocTemplate(
        pdf_filename,
        pagesize=letter,
        leftMargin=50,
        rightMargin=50,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#0f172a'),
        spaceAfter=4
    )

    subtitle_style = ParagraphStyle(
        'DocSub',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10.5,
        leading=14,
        textColor=colors.HexColor('#0284c7'),
        spaceAfter=12
    )

    h1_style = ParagraphStyle(
        'Heading1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=colors.HexColor('#0f172a'),
        spaceBefore=10,
        spaceAfter=6,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=14,
        textColor=colors.HexColor('#0369a1'),
        spaceBefore=7,
        spaceAfter=3,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor('#334155'),
        spaceAfter=5
    )

    body_bold = ParagraphStyle(
        'BodyBold',
        parent=body_style,
        fontName='Helvetica-Bold',
        textColor=colors.HexColor('#0f172a')
    )

    pitch_style = ParagraphStyle(
        'PitchText',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor('#0c4a6e')
    )

    table_header = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.white
    )

    table_body = ParagraphStyle(
        'TableBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.8,
        leading=10.5,
        textColor=colors.HexColor('#1e293b')
    )

    table_body_bold = ParagraphStyle(
        'TableBodyBold',
        parent=table_body,
        fontName='Helvetica-Bold',
        textColor=colors.HexColor('#0f172a')
    )

    qa_q = ParagraphStyle(
        'QAQuestion',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.8,
        leading=11.5,
        textColor=colors.HexColor('#0369a1'),
        spaceBefore=4,
        spaceAfter=2,
        keepWithNext=True
    )

    qa_a = ParagraphStyle(
        'QAAnswer',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.2,
        leading=11,
        textColor=colors.HexColor('#334155'),
        spaceAfter=5
    )

    story = []

    # Title Banner Block
    banner_data = [
        [
            Paragraph("<b>🌟 AURACAST — PROJECT REVIEW & VIVA GUIDE</b>", title_style),
        ],
        [
            Paragraph("<b>Subject:</b> Multimedia Systems &nbsp;•&nbsp; <b>Team Size:</b> 3 Students &nbsp;•&nbsp; <b>Execution:</b> Google Chrome / MS Edge", subtitle_style),
        ]
    ]
    banner_table = Table(banner_data, colWidths=[512])
    banner_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f0f9ff')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#bae6fd')),
        ('PADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,0), 0),
    ]))
    story.append(banner_table)
    story.append(Spacer(1, 8))

    # SECTION 1: HOW IT WORKS (IN SHORT)
    story.append(Paragraph("1. HOW AURACAST WORKS (TECHNICAL SUMMARY)", h1_style))
    story.append(Paragraph(
        "AuraCast transforms a standard webcam into a touchless virtual multimedia studio by coupling <b>Real-Time Computer Vision</b> with the <b>Web Audio API</b> and a <b>3-Layer HTML5 Canvas Stack</b>. No special hardware, depth sensors, or server backends are required.",
        body_style
    ))

    arch_data = [
        [
            Paragraph("<b>Pipeline Stage</b>", table_header),
            Paragraph("<b>Core Technology & Mathematics</b>", table_header),
            Paragraph("<b>Syllabus Mapping</b>", table_header),
        ],
        [
            Paragraph("<b>1. Vision Sensing</b>", table_body_bold),
            Paragraph("MediaPipe captures 21 3D hand coordinates (X, Y, Z) per frame at 60 FPS from raw video stream.", table_body),
            Paragraph("Module 3 & 4 (Image / Video)", table_body),
        ],
        [
            Paragraph("<b>2. Gesture Engine</b>", table_body_bold),
            Paragraph("Calculates Euclidean distances between fingertips and MCP joints to classify 5 static poses (Point, Fist, Palm, Peace, Pinch) + horizontal velocity vectors for dynamic Swipes.", table_body),
            Paragraph("Module 3 (Spatial Geometry)", table_body),
        ],
        [
            Paragraph("<b>3. Canvas Stack</b>", table_body_bold),
            Paragraph("3 hardware-accelerated canvas layers: Layer 1 (Video + Sobel convolution filter), Layer 2 (Air Canvas with Bézier smoothing), Layer 3 (Interactive HUD & 3D instrument reticles).", table_body),
            Paragraph("Module 3 & 4 (Graphics & Animation)", table_body),
        ],
        [
            Paragraph("<b>4. Audio Synthesis</b>", table_body_bold),
            Paragraph("Client-side polyphonic AudioContext generating synthesized 808 kicks, snare noise bursts, and 8-key melodic synth with dynamic ADSR envelopes + live 128-bin FFT spectrum.", table_body),
            Paragraph("Module 2 (Sound & Audio DSP)", table_body),
        ],
        [
            Paragraph("<b>5. QoS Telemetry</b>", table_body_bold),
            Paragraph("Live latency budget monitor (FPS, processing time, hand tracking confidence) with automated fallback to mouse simulation mode.", table_body),
            Paragraph("Module 6 & 7 (Real-Time Systems)", table_body),
        ],
    ]
    arch_table = Table(arch_data, colWidths=[90, 310, 112])
    arch_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0369a1')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('PADDING', (0,0), (-1,-1), 4.5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor('#ffffff'), colors.HexColor('#f8fafc')])
    ]))
    story.append(arch_table)
    story.append(Spacer(1, 10))

    # SECTION 2: WHAT TO EXPLAIN TO MA'AM IN REVIEW
    story.append(Paragraph("2. WHAT TO EXPLAIN TO MA'AM IN REVIEW (EXACT SCRIPT)", h1_style))

    # 30-Second Elevator Pitch Box
    pitch_data = [
        [
            Paragraph("<b>🎙️ THE 30-SECOND OPENING PITCH (Memorize & Say This First)</b>", h2_style),
        ],
        [
            Paragraph(
                "<i>\"Good morning Ma'am. Our project is <b>AuraCast</b> — a touchless virtual multimedia studio running directly in the web browser. "
                "Using just a standard laptop webcam, AuraCast captures 21 3D hand landmarks at 60 FPS, classifies natural spatial gestures, and connects them directly to real-time Web Audio API sound synthesis and AR computer graphics.<br/><br/>"
                "We designed AuraCast specifically around our <b>Multimedia Systems syllabus</b>: it implements client-side <b>Audio DSP & ADSR envelopes (Module 2)</b>, <b>spatial 3x3 Sobel convolution filtering (Module 3)</b>, <b>Bézier animation & particle physics (Module 4)</b>, and <b>real-time QoS latency monitoring (Modules 6 & 7)</b>.\"</i>",
                pitch_style
            )
        ]
    ]
    pitch_table = Table(pitch_data, colWidths=[512])
    pitch_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f0fdf4')),
        ('BOX', (0,0), (-1,-1), 1.2, colors.HexColor('#86efac')),
        ('PADDING', (0,0), (-1,-1), 7),
    ]))
    story.append(pitch_table)
    story.append(Spacer(1, 9))

    # 3-Minute Live Demo Walkthrough
    story.append(Paragraph("<b>⏱️ 3-MINUTE ACTION-BY-ACTION DEMO SEQUENCE FOR MA'AM</b>", h2_style))
    demo_data = [
        [
            Paragraph("<b>Time</b>", table_header),
            Paragraph("<b>Action on Screen</b>", table_header),
            Paragraph("<b>What to Say to Ma'am (The Explanation)</b>", table_header),
        ],
        [
            Paragraph("<b>0:00 - 0:45</b>", table_body_bold),
            Paragraph("<b>Air Canvas</b><br/>Point index finger to draw neon curves in air. Show open palm to erase.", table_body),
            Paragraph("\"Here we capture the index tip (landmark 8). We use <i>Quadratic Bézier interpolation</i> between frame coordinates to eliminate human tremor, combined with particle physics for glowing trails.\"", table_body),
        ],
        [
            Paragraph("<b>0:45 - 1:30</b>", table_body_bold),
            Paragraph("<b>Air Synth & Drums</b><br/>Tap floating drum pads (Kick, Snare, Hi-Hat) & synth keys in mid-air.", table_body),
            Paragraph("\"This is Module 2 (Audio). Each pad uses real-time <i>Web Audio API oscillators and noise buffers with custom ADSR envelopes</i>. Notice the 128-bin FFT spectrum visualizer at the bottom showing real-time frequency response.\"", table_body),
        ],
        [
            Paragraph("<b>1:30 - 2:15</b>", table_body_bold),
            Paragraph("<b>Gesture DJ Deck</b><br/>Closed fist to play/pause. Move hand up/down to change volume. Swipe left/right.", table_body),
            Paragraph("\"Here we map continuous spatial coordinates to audio gain (Y-axis = volume). Swiping detects horizontal velocity vectors (&Delta;X/&Delta;t) across a 5-frame sliding window to trigger track skip.\"", table_body),
        ],
        [
            Paragraph("<b>2:15 - 3:00</b>", table_body_bold),
            Paragraph("<b>Vision Filters & Telemetry</b><br/>Switch to Sobel Edge filter. Show live telemetry HUD.", table_body),
            Paragraph("\"Under Module 3, this executes a real-time <i>3x3 Sobel spatial convolution kernel</i> directly on pixel luminance. The bottom HUD proves our QoS: stable 60 FPS with &lt;6ms pipeline latency.\"", table_body),
        ],
    ]
    demo_table = Table(demo_data, colWidths=[55, 175, 282])
    demo_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0f172a')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('PADDING', (0,0), (-1,-1), 4),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor('#ffffff'), colors.HexColor('#f8fafc')])
    ]))
    story.append(demo_table)

    story.append(PageBreak())

    # SECTION 3: GROUP WORK DIVISION
    story.append(Paragraph("3. TEAM WORK DIVISION (3 STUDENTS) & SYLLABUS MAPPING", h1_style))
    story.append(Paragraph(
        "When Ma'am asks <i>\"Who did what?\"</i>, present this division clearly. Each student owns a distinct syllabus module:",
        body_style
    ))

    team_data = [
        [
            Paragraph("<b>Student & Role</b>", table_header),
            Paragraph("<b>Syllabus Module</b>", table_header),
            Paragraph("<b>Key Deliverables & Codebase Contribution</b>", table_header),
        ],
        [
            Paragraph("<b>Student 1</b><br/>Audio & DSP Synthesis Engineer", table_body_bold),
            Paragraph("<b>Module 2:</b><br/>Sound and Audio", table_body),
            Paragraph("• Built the Web Audio API synthesis engine (<code>js/audio-engine.js</code>).<br/>• Synthesized 808 Kick, Snare white noise burst, and 8-key melodic synth.<br/>• Programmed the 128-bin Fast Fourier Transform (FFT) frequency spectrum visualizer.<br/>• Implemented mathematical ADSR (Attack, Decay, Sustain, Release) gain envelopes.", table_body),
        ],
        [
            Paragraph("<b>Student 2</b><br/>Computer Vision & Graphics Engineer", table_body_bold),
            Paragraph("<b>Module 3 & 4:</b><br/>Images, Graphics & Animation", table_body),
            Paragraph("• Integrated MediaPipe 21-point hand tracking and gesture classifier (<code>js/vision-tracker.js</code>).<br/>• Developed Air Canvas with Quadratic Bézier smoothing and particle sparks (<code>js/air-canvas.js</code>).<br/>• Programmed pixel-level 3x3 Sobel operator for spatial edge detection (<code>js/filters.js</code>).<br/>• Created Cyberpunk and Thermal false-color look-up tables (LUT).", table_body),
        ],
        [
            Paragraph("<b>Student 3</b><br/>Interactive Systems & Telemetry Lead", table_body_bold),
            Paragraph("<b>Module 4, 6 & 7:</b><br/>Real-Time Systems & QoS", table_body),
            Paragraph("• Engineered 3D physical collision detection for air drum pads and keys (<code>js/instruments.js</code>).<br/>• Built the Gesture DJ media deck with elevation volume and velocity swipe skip (<code>js/media-deck.js</code>).<br/>• Implemented real-time QoS telemetry HUD (FPS, latency, hand confidence) (<code>js/app.js</code>).<br/>• Built hardware-independent Mouse Mode simulation fallback.", table_body),
        ],
    ]
    team_table = Table(team_data, colWidths=[120, 95, 297])
    team_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0369a1')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('PADDING', (0,0), (-1,-1), 5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor('#ffffff'), colors.HexColor('#f8fafc')])
    ]))
    story.append(team_table)
    story.append(Spacer(1, 10))

    # SECTION 4: TOP 6 REVIEW / VIVA QUESTIONS FROM MA'AM & BULLETPROOF ANSWERS
    story.append(Paragraph("4. TOP REVIEW / VIVA QUESTIONS & WINNING ANSWERS", h1_style))
    story.append(Paragraph(
        "Be prepared for these exact questions from the evaluator during the viva:",
        body_style
    ))

    qa_list = [
        (
            "Q1: Why did you synthesize audio via Web Audio API instead of just playing pre-recorded MP3 files?",
            "<b>Answer:</b> Pre-recorded MP3 files suffer from decode latency (50-100ms jitter), which destroys real-time musical responsiveness. Procedural synthesis with Web Audio API runs directly on the audio thread with near-zero latency (<5ms) and allows dynamic parameter manipulation (pitch bend, custom ADSR envelopes, filter cutoff modulation) in real time."
        ),
        (
            "Q2: How does the 3x3 Sobel Edge Detection filter work mathematically?",
            "<b>Answer:</b> The Sobel operator computes spatial gradient vectors on image luminance using two 3x3 convolution kernels: Gx = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]] for horizontal changes and Gy = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]] for vertical changes. The combined edge magnitude is calculated per pixel as G = sqrt(Gx^2 + Gy^2). If G exceeds a threshold, the pixel is marked as an edge."
        ),
        (
            "Q3: How do you classify a 'Swipe' gesture from a stationary hand movement?",
            "<b>Answer:</b> We track the horizontal velocity vector (Delta_X / Delta_t) of the wrist landmark across a sliding temporal window of 5 frames. A swipe event is dispatched only if horizontal velocity exceeds 0.35 normalized screen width per second and vertical displacement remains bounded under 0.15, avoiding false triggers."
        ),
        (
            "Q4: How does your system eliminate hand tremors while drawing in the air?",
            "<b>Answer:</b> We store recent landmark points and render Quadratic Bézier curves between the midpoints of consecutive coordinate pairs. This smooths out high-frequency biological hand tremors while maintaining low-latency path tracking at 60 FPS."
        ),
        (
            "Q5: How does your project demonstrate Real-Time Systems and QoS (Modules 6 & 7)?",
            "<b>Answer:</b> We enforce a strict 16.6ms frame budget (60 FPS). Our telemetry system monitors camera capture latency, neural inference time, and canvas composite duration. If tracking confidence drops or the camera is unavailable, an automatic QoS fallback activates Mouse Simulation mode to guarantee uninterrupted user experience."
        ),
        (
            "Q6: What coordinate system does MediaPipe hand tracking output?",
            "<b>Answer:</b> MediaPipe returns 21 3D landmarks per hand normalized between 0.0 and 1.0 relative to image width and height. The Z-coordinate represents relative depth from the camera (smaller/negative Z = closer to camera). We map normalized (X, Y) to canvas viewport pixels and use Z-depth for 3D strike velocity."
        )
    ]

    for q, a in qa_list:
        qa_data = [
            [Paragraph(q, qa_q)],
            [Paragraph(a, qa_a)]
        ]
        qa_table = Table(qa_data, colWidths=[512])
        qa_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
            ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
            ('LINELEFT', (0,0), (0,-1), 2.5, colors.HexColor('#0284c7')),
            ('PADDING', (0,0), (-1,-1), 4),
            ('TOPPADDING', (0,0), (-1,0), 2),
            ('BOTTOMPADDING', (0,1), (-1,1), 3),
        ]))
        story.append(qa_table)
        story.append(Spacer(1, 4))

    # SECTION 5: QUICK EMERGENCY CHECKLIST
    story.append(Spacer(1, 6))
    checklist_data = [
        [
            Paragraph("<b>🚨 QUICK PRESENTATION CHECKLIST BEFORE REVIEW WITH MA'AM</b>", h2_style)
        ],
        [
            Paragraph(
                "1. <b>Audio Activation:</b> Click the <b>\"🔊 Enable Sound\"</b> button at top before starting (browsers block audio autoplay until user interaction).<br/>"
                "2. <b>Lighting & Camera:</b> Ensure decent room lighting facing your hand, holding your hand approx. 0.5 - 1 meter from the webcam.<br/>"
                "3. <b>Emergency Fallback:</b> If the webcam lags or disconnects during the review, immediately click <b>\"🖱️ Mouse Mode\"</b> in the top right to continue the demo seamlessly using mouse movement!",
                body_style
            )
        ]
    ]
    checklist_table = Table(checklist_data, colWidths=[512])
    checklist_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#fef3c7')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#fde68a')),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(checklist_table)

    # Build PDF
    doc.build(story, canvasmaker=NumberedCanvas)
    print("SUCCESS: PDF successfully generated at:", pdf_filename)

if __name__ == '__main__':
    build_pdf()
