interface FollowupEvent {
  title: string;
  description: string;
  start: string;
  end: string;
}

interface Event {
  id: string;
  title: string;
  description?: string;
  start: string;
  end: string;
}

export async function generateFollowupEvents(parentEvent: Event, openaiApiKey: string): Promise<FollowupEvent[]> {
  try {
    const prompt = `Generate 2 follow-up events for this calendar event:
Title: ${parentEvent.title}
Description: ${parentEvent.description || 'No description'}
Date: ${parentEvent.start}

Generate realistic follow-up events that would naturally occur after this event. Consider:
- Project timelines and milestones
- Follow-up meetings or check-ins
- Review sessions or evaluations
- Next steps or continuation activities
- For medical appointments: follow-up visits, annual checkups, specialist referrals
- For work events: progress reviews, milestone check-ins, final presentations

Format as JSON array with exactly 2 events:
[{"title": "Event Title", "description": "Brief description", "start": "ISO_DATE", "end": "ISO_DATE"}]`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1',
        messages: [
          {
            role: 'system',
            content: 'You are an expert personal assistant and event planner. Generate realistic follow-up calendar events based on the context provided. Always return valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Parse the JSON response
    const followups = JSON.parse(content);
    
    // Validate and format the followups
    if (!Array.isArray(followups) || followups.length < 2) {
      throw new Error('Invalid followup format');
    }

    // Ensure we have exactly 2 followups with proper dates
    const formattedFollowups: FollowupEvent[] = followups.slice(0, 2).map((followup, index) => {
      const baseDate = new Date(parentEvent.start);
      const daysOffset = index === 0 ? 14 : 365; // 2 weeks and 1 year later
      
      const startDate = new Date(baseDate.getTime() + daysOffset * 24 * 60 * 60 * 1000);
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour duration
      
      return {
        title: followup.title || `Follow-up ${index + 1}`,
        description: followup.description || 'Follow-up event',
        start: startDate.toISOString(),
        end: endDate.toISOString()
      };
    });

    return formattedFollowups;
  } catch (error) {
    console.error('Error generating followups:', error);
    
    // Fallback to default followups if AI fails
    const baseDate = new Date(parentEvent.start);
    const weekLater = new Date(baseDate.getTime() + 14 * 24 * 60 * 60 * 1000); // 2 weeks later
    const yearLater = new Date(baseDate.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year later
    
    // Check if it's a medical appointment and provide appropriate fallbacks
    const isMedical = parentEvent.title.toLowerCase().includes('doctor') || 
                     parentEvent.title.toLowerCase().includes('appointment') ||
                     parentEvent.title.toLowerCase().includes('checkup') ||
                     parentEvent.title.toLowerCase().includes('visit');
    
    if (isMedical) {
      return [
        {
          title: 'Follow-up Doctor Visit',
          description: 'Check progress and discuss next steps',
          start: weekLater.toISOString(),
          end: new Date(weekLater.getTime() + 60 * 60 * 1000).toISOString()
        },
        {
          title: 'Annual Physical Exam',
          description: 'Routine annual health checkup',
          start: yearLater.toISOString(),
          end: new Date(yearLater.getTime() + 60 * 60 * 1000).toISOString()
        }
      ];
    }
    
    return [
      {
        title: 'Follow-up Meeting',
        description: 'Check progress on discussed items',
        start: weekLater.toISOString(),
        end: new Date(weekLater.getTime() + 60 * 60 * 1000).toISOString()
      },
      {
        title: 'Final Review',
        description: 'Complete project review and next steps',
        start: yearLater.toISOString(),
        end: new Date(yearLater.getTime() + 60 * 60 * 1000).toISOString()
      }
    ];
  }
}

export function generateMermaidFlowchart(parentEvent: Event, followups: FollowupEvent[]): string {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return `%%{init:{
  "theme":"base",
  "themeCSS": ".cluster rect{rx:12px!important;ry:12px!important;}.cluster.dateBox > rect{fill:#e8edf9;stroke:#4a6fa5;stroke-width:1.2px;}",
  "securityLevel":"loose"
}}%%
flowchart TD
    %% styles
    classDef dateBox fill:#e8edf9,stroke:#4a6fa5,stroke-width:1.2px
    classDef eventBox fill:#ffffff,stroke:#d1d5db,stroke-width:1px,color:#374151

    %% diagram
    subgraph D1 ["${formatDate(parentEvent.start)}"]
        EV0("${parentEvent.title}")
    end
    class D1 dateBox

    subgraph D2 ["${formatDate(followups[0].start)}"]
        EV1("${followups[0].title}")
    end
    class D2 dateBox

    subgraph D3 ["${formatDate(followups[1].start)}"]
        EV2("${followups[1].title}")
    end
    class D3 dateBox

    class EV0,EV1,EV2 eventBox

    D1 --> D2
    D2 --> D3

    %% ISO dates for reference
    %% ISO_DATE_1: ${parentEvent.start}
    %% ISO_DATE_2: ${followups[0].start}
    %% ISO_DATE_3: ${followups[1].start}

    %% click handlers on event nodes
    click EV0 "javascript:window.gotoDateWithTitle('${parentEvent.start}','${parentEvent.title}')"
    click EV1 "javascript:window.gotoDateWithTitle('${followups[0].start}','${followups[0].title}')"
    click EV2 "javascript:window.gotoDateWithTitle('${followups[1].start}','${followups[1].title}')"
`;
}
