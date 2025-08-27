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

Format as JSON array with exactly 2 events:
[{"title": "Event Title", "description": "Brief description", "start": "ISO_DATE", "end": "ISO_DATE"}]`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
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
      const daysOffset = index === 0 ? 7 : 30; // 1 week and 1 month later
      
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
    const weekLater = new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    const monthLater = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    
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
        start: monthLater.toISOString(),
        end: new Date(monthLater.getTime() + 60 * 60 * 1000).toISOString()
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

  return `flowchart TD
    subgraph D1["${formatDate(parentEvent.start)}"]
        EV0("${parentEvent.title}")
    end
    
    subgraph D2["${formatDate(followups[0].start)}"]
        EV1("${followups[0].title}")
    end
    
    subgraph D3["${formatDate(followups[1].start)}"]
        EV2("${followups[1].title}")
    end
    
    D1 --> D2
    D2 --> D3
    
    classDef dateBox fill:#e8edf9,stroke:#4a6fa5,stroke-width:1.2px
    class D1,D2,D3 dateBox`;
}
